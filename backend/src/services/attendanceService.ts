import { withTenantTransaction } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export const getAttendance = async (tenantId: string, coachUserId?: string) =>
  withTenantTransaction(tenantId, async (client) => {
    const result = await client.query(
      `SELECT a.* FROM attendance a
       JOIN trainings tr ON tr.id = a.training_id AND tr.tenant_id = a.tenant_id
       WHERE a.tenant_id = $1
         AND ($2::UUID IS NULL OR EXISTS (
           SELECT 1 FROM users u
           JOIN coaches c ON LOWER(c.email) = LOWER(u.email)
             AND c.tenant_id = u.tenant_id
           JOIN coach_team_assignments cta
             ON cta.coach_id = c.id AND cta.tenant_id = c.tenant_id
           WHERE u.id = $2 AND u.tenant_id = $1 AND cta.team_id = tr.equipo_id
             AND (cta.starts_on IS NULL OR cta.starts_on <= CURRENT_DATE)
             AND (cta.ends_on IS NULL OR cta.ends_on >= CURRENT_DATE)
         ))`,
      [tenantId, coachUserId ?? null]
    );
    return result.rows;
  });

export const createAttendance = async (tenantId: string, data: any) =>
  withTenantTransaction(tenantId, async (client) => {
    const { training_id, player_id, presente } = data;
    const result = await client.query(
      `INSERT INTO attendance (id, tenant_id, training_id, player_id, presente)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [uuidv4(), tenantId, training_id, player_id, presente]
    );
    return result.rows[0];
  });

export const updateAttendance = async (tenantId: string, id: string, data: any) =>
  withTenantTransaction(tenantId, async (client) => {
    const { training_id, player_id, presente } = data;
    const result = await client.query(
      `UPDATE attendance SET training_id = $1, player_id = $2, presente = $3
       WHERE id = $4 AND tenant_id = $5 RETURNING *`,
      [training_id, player_id, presente, id, tenantId]
    );
    if (result.rowCount === 0) throw new Error('Registro de asistencia no encontrado');
    return result.rows[0];
  });

export const deleteAttendance = async (tenantId: string, id: string) =>
  withTenantTransaction(tenantId, async (client) => {
    const result = await client.query('DELETE FROM attendance WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (result.rowCount === 0) throw new Error('Registro de asistencia no encontrado');
  });