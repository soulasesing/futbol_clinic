import { withTenantTransaction } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export const getStats = async (tenantId: string, coachUserId?: string) =>
  withTenantTransaction(tenantId, async (client) => {
    const result = await client.query(
      `SELECT s.* FROM stats s
       JOIN matches m ON m.id = s.match_id AND m.tenant_id = s.tenant_id
       WHERE s.tenant_id = $1
         AND ($2::UUID IS NULL OR EXISTS (
           SELECT 1 FROM users u
           JOIN coaches c ON LOWER(c.email) = LOWER(u.email)
             AND c.tenant_id = u.tenant_id
           JOIN coach_team_assignments cta
             ON cta.coach_id = c.id AND cta.tenant_id = c.tenant_id
           WHERE u.id = $2 AND u.tenant_id = $1
             AND (cta.team_id = m.equipo_local_id OR cta.team_id = m.equipo_visitante_id)
             AND (cta.starts_on IS NULL OR cta.starts_on <= CURRENT_DATE)
             AND (cta.ends_on IS NULL OR cta.ends_on >= CURRENT_DATE)
         ))`,
      [tenantId, coachUserId ?? null]
    );
    return result.rows;
  });

export const createStats = async (tenantId: string, data: any) =>
  withTenantTransaction(tenantId, async (client) => {
  const { player_id, match_id, goles, asistencias, tarjetas_amarillas, tarjetas_rojas } = data;
  const result = await client.query(
    `INSERT INTO stats (id, tenant_id, player_id, match_id, goles, asistencias, tarjetas_amarillas, tarjetas_rojas)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [uuidv4(), tenantId, player_id, match_id, goles, asistencias, tarjetas_amarillas, tarjetas_rojas]
  );
  return result.rows[0];
  });

export const updateStats = async (tenantId: string, id: string, data: any) =>
  withTenantTransaction(tenantId, async (client) => {
  const { player_id, match_id, goles, asistencias, tarjetas_amarillas, tarjetas_rojas } = data;
  const result = await client.query(
    `UPDATE stats SET player_id = $1, match_id = $2, goles = $3, asistencias = $4, tarjetas_amarillas = $5, tarjetas_rojas = $6
     WHERE id = $7 AND tenant_id = $8 RETURNING *`,
    [player_id, match_id, goles, asistencias, tarjetas_amarillas, tarjetas_rojas, id, tenantId]
  );
  if (result.rowCount === 0) throw new Error('Estadística no encontrada');
  return result.rows[0];
  });

export const deleteStats = async (tenantId: string, id: string) =>
  withTenantTransaction(tenantId, async (client) => {
  const result = await client.query('DELETE FROM stats WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  if (result.rowCount === 0) throw new Error('Estadística no encontrada');
  });