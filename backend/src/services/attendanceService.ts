import { pool } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export const getAttendance = async (tenantId: string) => {
  const result = await pool.query('SELECT * FROM attendance WHERE tenant_id = $1', [tenantId]);
  return result.rows;
};

export const createAttendance = async (tenantId: string, data: any) => {
  const { training_id, player_id, presente } = data;
  const result = await pool.query(
    `INSERT INTO attendance (id, tenant_id, training_id, player_id, presente)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [uuidv4(), tenantId, training_id, player_id, presente]
  );
  return result.rows[0];
};

export const updateAttendance = async (tenantId: string, id: string, data: any) => {
  const { training_id, player_id, presente } = data;
  const result = await pool.query(
    `UPDATE attendance SET training_id = $1, player_id = $2, presente = $3
     WHERE id = $4 AND tenant_id = $5 RETURNING *`,
    [training_id, player_id, presente, id, tenantId]
  );
  if (result.rowCount === 0) throw new Error('Registro de asistencia no encontrado');
  return result.rows[0];
};

export const deleteAttendance = async (tenantId: string, id: string) => {
  const result = await pool.query('DELETE FROM attendance WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  if (result.rowCount === 0) throw new Error('Registro de asistencia no encontrado');
}; 