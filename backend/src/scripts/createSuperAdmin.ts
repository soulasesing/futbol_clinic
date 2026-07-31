import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const databaseUrl = process.env.MIGRATOR_DATABASE_URL;
const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SUPER_ADMIN_PASSWORD;
const name = process.env.SUPER_ADMIN_NAME?.trim() || 'Super Admin';

if (!databaseUrl) {
  throw new Error('MIGRATOR_DATABASE_URL is required');
}
if (!email?.includes('@')) {
  throw new Error('SUPER_ADMIN_EMAIL must be a valid email');
}
if (!password || password.length < 14) {
  throw new Error('SUPER_ADMIN_PASSWORD must contain at least 14 characters');
}

const provision = async (): Promise<void> => {
  const adminPool = new Pool({ connectionString: databaseUrl, max: 1 });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await adminPool.query(
      `INSERT INTO users (id, tenant_id, nombre, email, password_hash, rol, is_active)
       VALUES ($1, NULL, $2, $3, $4, 'super_admin', TRUE)
       ON CONFLICT DO NOTHING`,
      [uuidv4(), name, email, passwordHash]
    );

    const result = await adminPool.query(
      `SELECT id FROM users
       WHERE tenant_id IS NULL AND LOWER(email) = $1 AND rol = 'super_admin'`,
      [email]
    );
    if (!result.rows[0]) {
      throw new Error('Super administrator was not created');
    }
    process.stdout.write(`Super administrator ready: ${email}\n`);
  } finally {
    await adminPool.end();
  }
};

void provision().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Provisioning failed'}\n`);
  process.exitCode = 1;
});
