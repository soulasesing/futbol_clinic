const { createHash, randomUUID } = require('node:crypto');
const { Pool } = require('pg');
const request = require('supertest');

process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-only-secret-with-at-least-thirty-two-characters';
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL =
  process.env.FRONTEND_URL || 'https://frontend.example.test';

const app = require('../dist/app').default;
const jwt = require('../dist/utils/jwt');

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
      `INSERT INTO tenants (id, nombre, email_contacto, slug)
       VALUES ($1, 'Tenant A', $3, $5), ($2, 'Tenant B', $4, $6)`,
      [
        tenantA,
        tenantB,
        `a-${tenantA}@example.test`,
        `b-${tenantB}@example.test`,
        `tenant-a-${tenantA}`,
        `tenant-b-${tenantB}`,
      ]
    );

    const appUrl = new URL(process.env.DATABASE_URL);
    appUrl.username = roleName;
    appUrl.password = rolePassword;
    appPool = new Pool({ connectionString: appUrl.toString(), max: 1 });
  });

  afterAll(async () => {
    if (appPool) await appPool.end();
    await adminPool.query('ALTER TABLE audit_events DISABLE TRIGGER immutable_audit_events');
    try {
      await adminPool.query(
        'DELETE FROM audit_events WHERE tenant_id = ANY($1::uuid[])',
        [[tenantA, tenantB]]
      );
      await adminPool.query(
        'DELETE FROM tenants WHERE id = ANY($1::uuid[])',
        [[tenantA, tenantB]]
      );
    } finally {
      await adminPool.query('ALTER TABLE audit_events ENABLE TRIGGER immutable_audit_events');
    }
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

  test('blocks existing sessions immediately after tenant suspension', async () => {
    const tenantToken = jwt.sign({
      userId: randomUUID(),
      tenantId: tenantA,
      role: 'admin',
    });
    const superAdminToken = jwt.sign({
      userId: randomUUID(),
      tenantId: null,
      role: 'super_admin',
    });
    const suspensionResponse = await request(app)
      .patch(`/api/tenants/${tenantA}/status`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ status: 'suspended', reason: 'Payment pending' });
    if (suspensionResponse.status !== 200) {
      throw new Error(JSON.stringify(suspensionResponse.body));
    }
    expect(suspensionResponse.status).toBe(200);
    try {
      const response = await request(app)
        .get('/api/players')
        .set('Authorization', `Bearer ${tenantToken}`);
      expect(response.status).toBe(403);
      if (response.body.code !== 'TENANT_SUSPENDED') {
        throw new Error(JSON.stringify(response.body));
      }
    } finally {
      await request(app)
        .patch(`/api/tenants/${tenantA}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: 'active' })
        .expect(200);
    }
  });

  test('creates a hashed reset token and accepts it once', async () => {
    const userId = randomUUID();
    const email = `reset-${userId}@example.test`;
    const client = await appPool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `SELECT set_config('app.current_tenant', $1, true)`,
        [tenantA]
      );
      await client.query(
        `INSERT INTO users
           (id, tenant_id, nombre, email, password_hash, rol, is_active)
         VALUES ($1, $2, 'Reset User', $3, 'temporary-hash', 'admin', TRUE)`,
        [userId, tenantA, email]
      );
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    let emailOutput = '';
    const writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      emailOutput += String(chunk);
      return true;
    });
    const forgotResponse = await request(app)
      .post('/api/auth/forgot')
      .send({ email, slug: `tenant-a-${tenantA}` });
    writeSpy.mockRestore();
    expect(forgotResponse.status).toBe(200);

    const tokenMatch = emailOutput.match(/token=([^"<\s]+)/);
    expect(tokenMatch).not.toBeNull();
    const token = decodeURIComponent(tokenMatch[1]);
    const storedToken = await adminPool.query(
      'SELECT reset_token FROM users WHERE id = $1',
      [userId]
    );
    expect(storedToken.rows[0].reset_token).toMatch(/^[a-f0-9]{64}$/);
    expect(storedToken.rows[0].reset_token).not.toBe(token);
    expect(storedToken.rows[0].reset_token).toBe(
      createHash('sha256').update(token).digest('hex')
    );
    const resetClient = await appPool.connect();
    try {
      await resetClient.query('BEGIN');
      await resetClient.query(
        `SELECT set_config('app.current_tenant', $1, true)`,
        [tenantA]
      );
      const resetCandidate = await resetClient.query(
        `SELECT id, reset_token = $1 AS token_matches,
                reset_token_expires > NOW() AS is_valid,
                reset_token_expires, NOW() AS database_now
         FROM users WHERE id = $2 AND tenant_id = $3`,
        [storedToken.rows[0].reset_token, userId, tenantA]
      );
      expect(resetCandidate.rows).toHaveLength(1);
      expect(resetCandidate.rows[0].token_matches).toBe(true);
      expect(resetCandidate.rows[0].is_valid).toBe(true);
      await resetClient.query('COMMIT');
    } finally {
      resetClient.release();
    }

    const resetResponse = await request(app)
      .post('/api/auth/reset')
      .send({ token, password: 'UpdatedPassword!2026' });
    if (resetResponse.status !== 200) {
      throw new Error(JSON.stringify(resetResponse.body));
    }
    await request(app)
      .post('/api/auth/reset')
      .send({ token, password: 'UpdatedPassword!2026' })
      .expect(400);
    await request(app)
      .post('/api/auth/tenant-login')
      .send({
        email,
        password: 'UpdatedPassword!2026',
        slug: `tenant-a-${tenantA}`,
      })
      .expect(200);
  });

  test('onboards, links and suspends a parent through an invitation', async () => {
    const adminId = randomUUID();
    const playerId = randomUUID();
    const parentEmail = `parent-${playerId}@example.test`;
    const client = await appPool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `SELECT set_config('app.current_tenant', $1, true)`,
        [tenantA]
      );
      await client.query(
        `INSERT INTO users
           (id, tenant_id, nombre, email, password_hash, rol, is_active)
         VALUES ($1, $2, 'Family Admin', $3, 'temporary-hash', 'admin', TRUE)`,
        [adminId, tenantA, `family-admin-${adminId}@example.test`]
      );
      await client.query(
        `INSERT INTO players
           (id, tenant_id, nombre, apellido, cedula, fecha_nacimiento, categoria)
         VALUES ($1, $2, 'Child', 'Workflow', $3, '2014-02-01', 'Sub-12')`,
        [playerId, tenantA, `CI-${playerId}`]
      );
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    const adminToken = jwt.sign({
      userId: adminId,
      tenantId: tenantA,
      role: 'admin',
    });
    const inviteResponse = await request(app)
      .post('/api/v1/parents/invite')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Parent',
        lastName: 'Workflow',
        email: parentEmail,
        relationship: 'Madre',
        playerIds: [playerId],
        canViewFinances: true,
        canSubmitPayments: true,
      })
      .expect(201);
    expect(inviteResponse.body.invitationLink).toContain(
      `/escuela/tenant-a-${tenantA}/registro?token=`
    );
    const invitationUrl = new URL(inviteResponse.body.invitationLink);
    const invitationToken = invitationUrl.searchParams.get('token');
    expect(invitationToken).toBeTruthy();

    const storedInvitation = await adminPool.query(
      `SELECT token FROM invitations
       WHERE tenant_id = $1 AND email = $2 ORDER BY created_at DESC LIMIT 1`,
      [tenantA, parentEmail]
    );
    expect(storedInvitation.rows[0].token).toMatch(/^[a-f0-9]{64}$/);
    expect(storedInvitation.rows[0].token).toBe(
      createHash('sha256').update(invitationToken).digest('hex')
    );

    await request(app)
      .get(`/api/v1/parents/invitation/${encodeURIComponent(invitationToken)}`)
      .expect(200);
    const registration = await request(app)
      .post('/api/auth/register')
      .send({
        token: invitationToken,
        nombre: 'Parent Workflow',
        password: 'ParentSecure!2026',
      })
      .expect(200);
    expect(registration.body.user.role).toBe('parent');

    const portal = await request(app)
      .get('/api/v1/family/portal')
      .set('Authorization', `Bearer ${registration.body.jwt}`)
      .expect(200);
    expect(portal.body.children).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: playerId })])
    );

    const parents = await request(app)
      .get('/api/v1/parents')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const parent = parents.body.find((item) => item.email === parentEmail);
    expect(parent.access_status).toBe('active');
    await request(app)
      .patch(`/api/v1/parents/${parent.id}/access`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: false })
      .expect(204);
    await request(app)
      .post('/api/auth/tenant-login')
      .send({
        email: parentEmail,
        password: 'ParentSecure!2026',
        slug: `tenant-a-${tenantA}`,
      })
      .expect(400);
  });

  test('denies parents access to legacy player APIs', async () => {
    const token = jwt.sign({
      userId: randomUUID(),
      tenantId: tenantA,
      role: 'parent',
    });
    const playersResponse = await request(app)
      .get('/api/players')
      .set('Authorization', `Bearer ${token}`);
    const testsResponse = await request(app)
      .get('/api/physical-tests/player/00000000-0000-4000-8000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    const uploadResponse = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`);
    expect([
      playersResponse.status,
      testsResponse.status,
      uploadResponse.status,
    ]).toEqual([403, 403, 403]);
  });
});
