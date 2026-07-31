import { withTenantTransaction } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export const getTeams = async (tenantId: string) =>
  withTenantTransaction(tenantId, async (client) => {
    const result = await client.query('SELECT * FROM teams WHERE tenant_id = $1', [tenantId]);
    return result.rows;
  });

export const getTeamsWithPlayersAndCoach = async (tenantId: string) =>
  withTenantTransaction(tenantId, async (client) => {
  // Equipos
  const teamsRes = await client.query('SELECT t.id, t.nombre, t.categoria, t.entrenador_id, c.nombre AS entrenador_nombre, c.apellido AS entrenador_apellido FROM teams t LEFT JOIN coaches c ON t.entrenador_id = c.id AND c.tenant_id = $1 WHERE t.tenant_id = $1', [tenantId]);
  const teams = teamsRes.rows;
  // Para cada equipo, obtener jugadores
  for (const team of teams) {
    const playersRes = await client.query(
      `SELECT p.id, p.nombre, p.apellido, p.foto_url
       FROM player_teams pt
       INNER JOIN players p ON pt.player_id = p.id AND p.tenant_id = $2
       WHERE pt.team_id = $1 AND pt.tenant_id = $2`,
      [team.id, tenantId]
    );
    team.jugadores = playersRes.rows;
  }
  return teams;
  });

export const createTeam = async (tenantId: string, data: any) =>
  withTenantTransaction(tenantId, async (client) => {
  const { nombre, categoria, entrenador_id, descripcion } = data;
  const result = await client.query(
    `INSERT INTO teams (id, tenant_id, nombre, categoria, entrenador_id, descripcion)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [uuidv4(), tenantId, nombre, categoria, entrenador_id, descripcion]
  );
  return result.rows[0];
  });

export const updateTeam = async (tenantId: string, id: string, data: any) =>
  withTenantTransaction(tenantId, async (client) => {
  const { nombre, categoria, entrenador_id, descripcion } = data;
  const result = await client.query(
    `UPDATE teams SET nombre = $1, categoria = $2, entrenador_id = $3, descripcion = $4
     WHERE id = $5 AND tenant_id = $6 RETURNING *`,
    [nombre, categoria, entrenador_id, descripcion, id, tenantId]
  );
  if (result.rowCount === 0) throw new Error('Equipo no encontrado');
  return result.rows[0];
  });

export const deleteTeam = async (tenantId: string, id: string) =>
  withTenantTransaction(tenantId, async (client) => {
  const result = await client.query('DELETE FROM teams WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  if (result.rowCount === 0) throw new Error('Equipo no encontrado');
  });