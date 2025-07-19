import { pool } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export const getPlayers = async (tenantId: string) => {
  const result = await pool.query('SELECT * FROM players WHERE tenant_id = $1', [tenantId]);
  return result.rows;
};

export const createPlayer = async (tenantId: string, data: any) => {
  const { nombre, apellido, cedula, fecha_nacimiento, categoria, foto_url, document_url } = data;
  const result = await pool.query(
    `INSERT INTO players (id, tenant_id, nombre, apellido, cedula, fecha_nacimiento, categoria, foto_url, document_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [uuidv4(), tenantId, nombre, apellido, cedula, fecha_nacimiento, categoria, foto_url, document_url]
  );
  return result.rows[0];
};

export const updatePlayer = async (tenantId: string, id: string, data: any) => {
  const { nombre, apellido, cedula, fecha_nacimiento, categoria, foto_url, document_url } = data;
  const result = await pool.query(
    `UPDATE players SET nombre = $1, apellido = $2, cedula = $3, fecha_nacimiento = $4, categoria = $5, foto_url = $6, document_url = $7
     WHERE id = $8 AND tenant_id = $9 RETURNING *`,
    [nombre, apellido, cedula, fecha_nacimiento, categoria, foto_url, document_url, id, tenantId]
  );
  if (result.rowCount === 0) throw new Error('Jugador no encontrado');
  return result.rows[0];
};

export const deletePlayer = async (tenantId: string, id: string) => {
  const result = await pool.query('DELETE FROM players WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  if (result.rowCount === 0) throw new Error('Jugador no encontrado');
};

export const getPlayerById = async (tenantId: string, id: string) => {
  const result = await pool.query('SELECT * FROM players WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  if (result.rowCount === 0) throw new Error('Jugador no encontrado');
  return result.rows[0];
}; 