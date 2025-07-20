import { pool } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export const getPlayers = async (tenantId: string) => {
  const result = await pool.query('SELECT * FROM players WHERE tenant_id = $1', [tenantId]);
  return result.rows;
};

export const getPlayerTeams = async (tenantId: string, playerId: string) => {
  const result = await pool.query(
    `SELECT t.* FROM teams t
     INNER JOIN player_teams pt ON pt.team_id = t.id
     WHERE pt.player_id = $1 AND pt.tenant_id = $2`,
    [playerId, tenantId]
  );
  return result.rows;
};

export const setPlayerTeams = async (tenantId: string, playerId: string, teamIds: string[]) => {
  // Eliminar relaciones actuales
  await pool.query('DELETE FROM player_teams WHERE player_id = $1 AND tenant_id = $2', [playerId, tenantId]);
  // Insertar nuevas relaciones
  for (const teamId of teamIds) {
    await pool.query(
      'INSERT INTO player_teams (tenant_id, player_id, team_id) VALUES ($1, $2, $3)',
      [tenantId, playerId, teamId]
    );
  }
};

export const createPlayer = async (tenantId: string, data: any) => {
  const { nombre, apellido, cedula, fecha_nacimiento, foto_url, document_url, team_ids } = data;
  const result = await pool.query(
    `INSERT INTO players (id, tenant_id, nombre, apellido, cedula, fecha_nacimiento, foto_url, document_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [uuidv4(), tenantId, nombre, apellido, cedula, fecha_nacimiento, foto_url, document_url]
  );
  const player = result.rows[0];
  if (Array.isArray(team_ids) && team_ids.length > 0) {
    await setPlayerTeams(tenantId, player.id, team_ids);
  }
  return player;
};

export const updatePlayer = async (tenantId: string, id: string, data: any) => {
  const { nombre, apellido, cedula, fecha_nacimiento, foto_url, document_url, team_ids } = data;
  const result = await pool.query(
    `UPDATE players SET nombre = $1, apellido = $2, cedula = $3, fecha_nacimiento = $4, foto_url = $5, document_url = $6
     WHERE id = $7 AND tenant_id = $8 RETURNING *`,
    [nombre, apellido, cedula, fecha_nacimiento, foto_url, document_url, id, tenantId]
  );
  if (result.rowCount === 0) throw new Error('Jugador no encontrado');
  if (Array.isArray(team_ids)) {
    await setPlayerTeams(tenantId, id, team_ids);
  }
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