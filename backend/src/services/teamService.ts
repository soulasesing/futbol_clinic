import { withTenantTransaction } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export const getTeams = async (tenantId: string, coachUserId?: string) =>
  withTenantTransaction(tenantId, async (client) => {
    const result = await client.query(
      `SELECT t.* FROM teams t
       WHERE t.tenant_id = $1
         AND ($2::UUID IS NULL OR EXISTS (
           SELECT 1 FROM users u
           JOIN coaches c ON LOWER(c.email) = LOWER(u.email)
             AND c.tenant_id = u.tenant_id
           JOIN coach_team_assignments cta
             ON cta.coach_id = c.id AND cta.tenant_id = c.tenant_id
           WHERE u.id = $2 AND u.tenant_id = $1 AND cta.team_id = t.id
             AND (cta.starts_on IS NULL OR cta.starts_on <= CURRENT_DATE)
             AND (cta.ends_on IS NULL OR cta.ends_on >= CURRENT_DATE)
         ))
       ORDER BY t.nombre`,
      [tenantId, coachUserId ?? null]
    );
    return result.rows;
  });

export const getTeamsWithPlayersAndCoach = async (
  tenantId: string,
  coachUserId?: string
) =>
  withTenantTransaction(tenantId, async (client) => {
  // Equipos
  const teamsRes = await client.query(
    `SELECT t.id, t.nombre, t.categoria, t.entrenador_id,
       c.nombre AS entrenador_nombre, c.apellido AS entrenador_apellido
     FROM teams t
     LEFT JOIN coaches c ON t.entrenador_id = c.id AND c.tenant_id = $1
     WHERE t.tenant_id = $1
       AND ($2::UUID IS NULL OR EXISTS (
         SELECT 1 FROM users u
         JOIN coaches assigned ON LOWER(assigned.email) = LOWER(u.email)
           AND assigned.tenant_id = u.tenant_id
         JOIN coach_team_assignments cta
           ON cta.coach_id = assigned.id AND cta.tenant_id = assigned.tenant_id
         WHERE u.id = $2 AND u.tenant_id = $1 AND cta.team_id = t.id
           AND (cta.starts_on IS NULL OR cta.starts_on <= CURRENT_DATE)
           AND (cta.ends_on IS NULL OR cta.ends_on >= CURRENT_DATE)
       ))
     ORDER BY t.nombre`,
    [tenantId, coachUserId ?? null]
  );
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