import { pool } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export const getCoaches = async (tenantId: string) => {
  const result = await pool.query('SELECT * FROM coaches WHERE tenant_id = $1', [tenantId]);
  return result.rows;
};

export const createCoach = async (tenantId: string, data: any) => {
  const { nombre, apellido, email, telefono, foto_url } = data;
  const result = await pool.query(
    `INSERT INTO coaches (id, tenant_id, nombre, apellido, email, telefono, foto_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [uuidv4(), tenantId, nombre, apellido, email, telefono, foto_url]
  );
  return result.rows[0];
};

export const updateCoach = async (tenantId: string, id: string, data: any) => {
  const { nombre, apellido, email, telefono, foto_url } = data;
  const result = await pool.query(
    `UPDATE coaches SET nombre = $1, apellido = $2, email = $3, telefono = $4, foto_url = $5
     WHERE id = $6 AND tenant_id = $7 RETURNING *`,
    [nombre, apellido, email, telefono, foto_url, id, tenantId]
  );
  if (result.rowCount === 0) throw new Error('Entrenador no encontrado');
  return result.rows[0];
};

export const deleteCoach = async (tenantId: string, id: string) => {
  const result = await pool.query('DELETE FROM coaches WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  if (result.rowCount === 0) throw new Error('Entrenador no encontrado');
}; 