import { NextFunction, Response } from 'express';
import { AuthRequest } from './authMiddleware';
import { withTenantTransaction } from '../utils/db';

export type CoachResource =
  | 'team'
  | 'player'
  | 'training'
  | 'match'
  | 'convocation'
  | 'attendance'
  | 'stats';

type ResourceIdResolver = (req: AuthRequest) => string | undefined;

const accessQueries: Record<CoachResource, string> = {
  team: 'cta.team_id = $3',
  player: `EXISTS (
    SELECT 1 FROM player_teams pt
    WHERE pt.tenant_id = $2 AND pt.player_id = $3 AND pt.team_id = cta.team_id
  )`,
  training: `EXISTS (
    SELECT 1 FROM trainings tr
    WHERE tr.tenant_id = $2 AND tr.id = $3 AND tr.equipo_id = cta.team_id
  )`,
  match: `EXISTS (
    SELECT 1 FROM matches m
    WHERE m.tenant_id = $2 AND m.id = $3
      AND (m.equipo_local_id = cta.team_id OR m.equipo_visitante_id = cta.team_id)
  )`,
  convocation: `EXISTS (
    SELECT 1 FROM match_convocations mc
    JOIN matches m ON m.id = mc.match_id AND m.tenant_id = mc.tenant_id
    WHERE mc.tenant_id = $2 AND mc.id = $3
      AND (m.equipo_local_id = cta.team_id OR m.equipo_visitante_id = cta.team_id)
  )`,
  attendance: `EXISTS (
    SELECT 1 FROM attendance a
    JOIN trainings tr ON tr.id = a.training_id AND tr.tenant_id = a.tenant_id
    WHERE a.tenant_id = $2 AND a.id = $3 AND tr.equipo_id = cta.team_id
  )`,
  stats: `EXISTS (
    SELECT 1 FROM stats s
    JOIN matches m ON m.id = s.match_id AND m.tenant_id = s.tenant_id
    WHERE s.tenant_id = $2 AND s.id = $3
      AND (m.equipo_local_id = cta.team_id OR m.equipo_visitante_id = cta.team_id)
  )`,
};

export const requireCoachAccess = (
  resource: CoachResource,
  resolveId: ResourceIdResolver
) => async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (req.user?.role === 'admin') {
    next();
    return;
  }
  if (req.user?.role !== 'coach' || !req.user.tenantId) {
    res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
    return;
  }
  const resourceId = resolveId(req);
  if (!resourceId) {
    res.status(400).json({ message: 'No se pudo identificar el recurso' });
    return;
  }
  try {
    const allowed = await withTenantTransaction(req.user.tenantId, async (client) => {
      const result = await client.query(
        `SELECT 1
         FROM users u
         JOIN coaches c
           ON LOWER(c.email) = LOWER(u.email) AND c.tenant_id = u.tenant_id
         JOIN coach_team_assignments cta
           ON cta.coach_id = c.id AND cta.tenant_id = c.tenant_id
         WHERE u.id = $1 AND u.tenant_id = $2
           AND ${accessQueries[resource]}
           AND (cta.starts_on IS NULL OR cta.starts_on <= CURRENT_DATE)
           AND (cta.ends_on IS NULL OR cta.ends_on >= CURRENT_DATE)
         LIMIT 1`,
        [req.user!.userId, req.user!.tenantId, resourceId]
      );
      return result.rowCount !== 0;
    });
    if (!allowed) {
      res.status(403).json({ message: 'No tienes acceso a este equipo' });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
};
