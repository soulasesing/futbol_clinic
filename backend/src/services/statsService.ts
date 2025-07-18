import { pool } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export const getStats = async (tenantId: string) => {
  const result = await pool.query('SELECT * FROM stats WHERE tenant_id = $1', [tenantId]);
  return result.rows;
};

export const createStats = async (tenantId: string, data: any) => {
  const { player_id, match_id, goles, asistencias, tarjetas_amarillas, tarjetas_rojas } = data;
  const result = await pool.query(
    `INSERT INTO stats (id, tenant_id, player_id, match_id, goles, asistencias, tarjetas_amarillas, tarjetas_rojas)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [uuidv4(), tenantId, player_id, match_id, goles, asistencias, tarjetas_amarillas, tarjetas_rojas]
  );
  return result.rows[0];
};

export const updateStats = async (tenantId: string, id: string, data: any) => {
  const { player_id, match_id, goles, asistencias, tarjetas_amarillas, tarjetas_rojas } = data;
  const result = await pool.query(
    `UPDATE stats SET player_id = $1, match_id = $2, goles = $3, asistencias = $4, tarjetas_amarillas = $5, tarjetas_rojas = $6
     WHERE id = $7 AND tenant_id = $8 RETURNING *`,
    [player_id, match_id, goles, asistencias, tarjetas_amarillas, tarjetas_rojas, id, tenantId]
  );
  if (result.rowCount === 0) throw new Error('Estadística no encontrada');
  return result.rows[0];
};

export const deleteStats = async (tenantId: string, id: string) => {
  const result = await pool.query('DELETE FROM stats WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  if (result.rowCount === 0) throw new Error('Estadística no encontrada');
}; 