import { pool } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export const getTrainings = async (tenantId: string) => {
  const result = await pool.query(
    `SELECT t.*, e.nombre as equipo_nombre, e.categoria as equipo_categoria 
     FROM trainings t 
     LEFT JOIN teams e ON t.equipo_id = e.id 
     WHERE t.tenant_id = $1`,
    [tenantId]
  );
  return result.rows;
};

export const createTraining = async (tenantId: string, data: any) => {
  const {
    equipo_id,
    fecha,
    hora_inicio,
    hora_fin,
    lugar,
    descripcion,
    es_recurrente,
    color,
    estado,
    dia_semana
  } = data;

  const result = await pool.query(
    `INSERT INTO trainings (
      id, tenant_id, equipo_id, fecha, hora_inicio, hora_fin,
      lugar, descripcion, es_recurrente, color, estado, dia_semana
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      uuidv4(), tenantId, equipo_id, fecha, hora_inicio, hora_fin,
      lugar, descripcion, es_recurrente, color, estado, dia_semana
    ]
  );
  return result.rows[0];
};

export const updateTraining = async (tenantId: string, id: string, data: any) => {
  const {
    equipo_id,
    fecha,
    hora_inicio,
    hora_fin,
    lugar,
    descripcion,
    es_recurrente,
    color,
    estado,
    dia_semana
  } = data;

  const result = await pool.query(
    `UPDATE trainings SET 
      equipo_id = $1, fecha = $2, hora_inicio = $3, hora_fin = $4,
      lugar = $5, descripcion = $6, es_recurrente = $7, color = $8,
      estado = $9, dia_semana = $10
    WHERE id = $11 AND tenant_id = $12 
    RETURNING *`,
    [
      equipo_id, fecha, hora_inicio, hora_fin, lugar, descripcion,
      es_recurrente, color, estado, dia_semana, id, tenantId
    ]
  );
  
  if (result.rowCount === 0) throw new Error('Entrenamiento no encontrado');
  return result.rows[0];
};

export const deleteTraining = async (tenantId: string, id: string) => {
  const result = await pool.query(
    'DELETE FROM trainings WHERE id = $1 AND tenant_id = $2',
    [id, tenantId]
  );
  if (result.rowCount === 0) throw new Error('Entrenamiento no encontrado');
}; 