const { randomUUID } = require('node:crypto');
const { Pool } = require('pg');

const runIntegration = process.env.RUN_DB_INTEGRATION_TESTS === 'true';
const describeDatabase = runIntegration ? describe : describe.skip;

describeDatabase('tenant row-level security', () => {
  const adminPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const roleName = 'fc_rls_test';
  const rolePassword = 'fc-rls-test-password';
  const tenantA = randomUUID();
  const tenantB = randomUUID();
  let appPool;

  beforeAll(async () => {
    await adminPool.query(`DROP ROLE IF EXISTS ${roleName}`);
    await adminPool.query(
      `CREATE ROLE ${roleName}
       LOGIN PASSWORD '${rolePassword}'
       NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT NOBYPASSRLS`
    );
    await adminPool.query(`GRANT futbol_clinic_app TO ${roleName}`);
    await adminPool.query(
      `INSERT INTO tenants (id, nombre, email_contacto)
       VALUES ($1, 'Tenant A', $3), ($2, 'Tenant B', $4)`,
      [tenantA, tenantB, `a-${tenantA}@example.test`, `b-${tenantB}@example.test`]
    );

    const appUrl = new URL(process.env.DATABASE_URL);
    appUrl.username = roleName;
    appUrl.password = rolePassword;
    appPool = new Pool({ connectionString: appUrl.toString(), max: 1 });
  });

  afterAll(async () => {
    if (appPool) await appPool.end();
    await adminPool.query('DELETE FROM tenants WHERE id = ANY($1::uuid[])', [[tenantA, tenantB]]);
    await adminPool.query(`DROP ROLE IF EXISTS ${roleName}`);
    await adminPool.end();
  });

  test('prevents one tenant from reading another tenant player', async () => {
    const playerId = randomUUID();
    const tenantAClient = await appPool.connect();
    try {
      await tenantAClient.query('BEGIN');
      await tenantAClient.query(
        `SELECT set_config('app.current_tenant', $1, true)`,
        [tenantA]
      );
      await tenantAClient.query(
        `INSERT INTO players
           (id, tenant_id, nombre, apellido, cedula, fecha_nacimiento, categoria)
         VALUES ($1, $2, 'Ada', 'Prueba', $3, '2012-01-01', 'Sub-14')`,
        [playerId, tenantA, `CI-${playerId}`]
      );
      await tenantAClient.query('COMMIT');
    } finally {
      tenantAClient.release();
    }

    const tenantBClient = await appPool.connect();
    try {
      await tenantBClient.query('BEGIN');
      await tenantBClient.query(
        `SELECT set_config('app.current_tenant', $1, true)`,
        [tenantB]
      );
      const result = await tenantBClient.query(
        'SELECT id FROM players WHERE id = $1',
        [playerId]
      );
      expect(result.rows).toHaveLength(0);
      await tenantBClient.query('COMMIT');
    } finally {
      tenantBClient.release();
    }
  });
});
