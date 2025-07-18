import { pool } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export const getMatches = async (tenantId: string) => {
  const result = await pool.query('SELECT * FROM matches WHERE tenant_id = $1', [tenantId]);
  return result.rows;
};

export const createMatch = async (tenantId: string, data: any) => {
  const { equipo_local_id, equipo_visitante_id, fecha, lugar, resultado } = data;
  const result = await pool.query(
    `INSERT INTO matches (id, tenant_id, equipo_local_id, equipo_visitante_id, fecha, lugar, resultado)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [uuidv4(), tenantId, equipo_local_id, equipo_visitante_id, fecha, lugar, resultado]
  );
  return result.rows[0];
};

export const updateMatch = async (tenantId: string, id: string, data: any) => {
  const { equipo_local_id, equipo_visitante_id, fecha, lugar, resultado } = data;
  const result = await pool.query(
    `UPDATE matches SET equipo_local_id = $1, equipo_visitante_id = $2, fecha = $3, lugar = $4, resultado = $5
     WHERE id = $6 AND tenant_id = $7 RETURNING *`,
    [equipo_local_id, equipo_visitante_id, fecha, lugar, resultado, id, tenantId]
  );
  if (result.rowCount === 0) throw new Error('Partido no encontrado');
  return result.rows[0];
};

export const deleteMatch = async (tenantId: string, id: string) => {
  const result = await pool.query('DELETE FROM matches WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  if (result.rowCount === 0) throw new Error('Partido no encontrado');
}; 