import { pool } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export const getTrainings = async (tenantId: string) => {
  const result = await pool.query('SELECT * FROM trainings WHERE tenant_id = $1', [tenantId]);
  return result.rows;
};

export const createTraining = async (tenantId: string, data: any) => {
  const { equipo_id, fecha, descripcion } = data;
  const result = await pool.query(
    `INSERT INTO trainings (id, tenant_id, equipo_id, fecha, descripcion)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [uuidv4(), tenantId, equipo_id, fecha, descripcion]
  );
  return result.rows[0];
};

export const updateTraining = async (tenantId: string, id: string, data: any) => {
  const { equipo_id, fecha, descripcion } = data;
  const result = await pool.query(
    `UPDATE trainings SET equipo_id = $1, fecha = $2, descripcion = $3
     WHERE id = $4 AND tenant_id = $5 RETURNING *`,
    [equipo_id, fecha, descripcion, id, tenantId]
  );
  if (result.rowCount === 0) throw new Error('Entrenamiento no encontrado');
  return result.rows[0];
};

export const deleteTraining = async (tenantId: string, id: string) => {
  const result = await pool.query('DELETE FROM trainings WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  if (result.rowCount === 0) throw new Error('Entrenamiento no encontrado');
}; 