import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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