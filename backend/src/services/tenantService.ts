import { pool } from '../utils/db';

export const getTenants = async () => {
  const result = await pool.query('SELECT id, nombre FROM tenants ORDER BY nombre');
  return result.rows;
}; 