import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in production');
}

const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parsePositiveInteger(
    process.env.DATABASE_MAX_CONNECTIONS,
    process.env.VERCEL ? 3 : 20
  ),
  idleTimeoutMillis: parsePositiveInteger(process.env.DATABASE_IDLE_TIMEOUT, 30_000),
  connectionTimeoutMillis: parsePositiveInteger(
    process.env.DATABASE_CONNECTION_TIMEOUT,
    10_000
  ),
  allowExitOnIdle: Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'test',
  application_name: process.env.VERCEL
    ? 'futbol-clinic-vercel'
    : 'futbol-clinic-backend',
});

export type TransactionClient = Pick<PoolClient, 'query'>;

const TENANT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const setLocalTenantContext = async (
  client: TransactionClient,
  tenantId: string
): Promise<void> => {
  if (!TENANT_ID_PATTERN.test(tenantId)) {
    throw new Error('Invalid tenant context');
  }

  await client.query(
    "SELECT set_config('app.current_tenant', $1, true)",
    [tenantId]
  );
};

export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const withTenantTransaction = async <T>(
  tenantId: string,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  return withTransaction(async (client) => {
    await setLocalTenantContext(client, tenantId);
    return callback(client);
  });
};