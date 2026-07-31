import { QueryResult, QueryResultRow } from 'pg';
import { withTenantTransaction } from '../utils/db';

export interface Actor {
  userId: string;
  tenantId: string;
  role: string;
}

export interface DomainResourceInput {
  [key: string]: unknown;
}

const adminRoles = new Set(['admin', 'super_admin']);

const tenantQuery = async <T extends QueryResultRow = QueryResultRow>(
  tenantId: string,
  text: string,
  values: unknown[] = []
): Promise<QueryResult<T>> =>
  withTenantTransaction(tenantId, (client) => client.query<T>(text, values));

export const isAdmin = (actor: Actor): boolean => adminRoles.has(actor.role);

const assertAdmin = (actor: Actor): void => {
  if (!isAdmin(actor)) throw new Error('FORBIDDEN: Se requiere rol administrador');
};

export const guardianOwnsPlayer = async (
  actor: Actor,
  playerId: string,
  permission: 'view' | 'submit' = 'view'
): Promise<boolean> => {
  if (isAdmin(actor)) return true;
  if (actor.role !== 'parent') return false;
  const permissionColumn =
    permission === 'submit' ? 'gp.can_submit_payments' : 'gp.can_view_finances';
  const result = await tenantQuery(actor.tenantId,
    `SELECT 1 FROM guardians g
     JOIN guardian_players gp ON gp.guardian_id = g.id AND gp.tenant_id = g.tenant_id
     WHERE g.tenant_id = $1 AND g.user_id = $2 AND gp.player_id = $3
       AND ${permissionColumn} = TRUE`,
    [actor.tenantId, actor.userId, playerId]
  );
  return (result.rowCount ?? 0) > 0;
};

export const guardianOwnsHousehold = async (
  actor: Actor,
  householdId: string,
  permission: 'view' | 'submit' = 'view'
): Promise<boolean> => {
  if (isAdmin(actor)) return true;
  if (actor.role !== 'parent') return false;
  const permissionColumn =
    permission === 'submit' ? 'gp.can_submit_payments' : 'gp.can_view_finances';
  const result = await tenantQuery(actor.tenantId,
    `SELECT 1 FROM guardians g
     LEFT JOIN guardian_players gp
       ON gp.guardian_id = g.id AND gp.tenant_id = g.tenant_id
     WHERE g.tenant_id = $1 AND g.user_id = $2 AND g.household_id = $3
       AND ${permissionColumn} = TRUE
     LIMIT 1`,
    [actor.tenantId, actor.userId, householdId]
  );
  return (result.rowCount ?? 0) > 0;
};

export const listLocations = async (actor: Actor): Promise<unknown[]> => {
  const result = await tenantQuery(actor.tenantId,
    `SELECT id, name, address, timezone, is_active, created_at
     FROM locations WHERE tenant_id = $1 ORDER BY name`,
    [actor.tenantId]
  );
  return result.rows;
};

export const createLocation = async (
  actor: Actor,
  input: DomainResourceInput
): Promise<unknown> => {
  assertAdmin(actor);
  const result = await tenantQuery(actor.tenantId,
    `INSERT INTO locations (tenant_id, name, address, timezone)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [actor.tenantId, input.name, input.address ?? null, input.timezone ?? 'UTC']
  );
  return result.rows[0];
};

export const listSeasons = async (actor: Actor): Promise<unknown[]> => {
  const result = await tenantQuery(actor.tenantId,
    `SELECT * FROM seasons WHERE tenant_id = $1 ORDER BY starts_on DESC`,
    [actor.tenantId]
  );
  return result.rows;
};

export const createSeason = async (
  actor: Actor,
  input: DomainResourceInput
): Promise<unknown> => {
  assertAdmin(actor);
  const result = await tenantQuery(actor.tenantId,
    `INSERT INTO seasons (tenant_id, name, starts_on, ends_on, is_active)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      actor.tenantId,
      input.name,
      input.startsOn,
      input.endsOn,
      input.isActive ?? true,
    ]
  );
  return result.rows[0];
};

export const createHousehold = async (
  actor: Actor,
  input: DomainResourceInput
): Promise<unknown> => {
  assertAdmin(actor);
  const result = await tenantQuery(actor.tenantId,
    `INSERT INTO households
       (tenant_id, name, billing_email, billing_phone, address)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      actor.tenantId,
      input.name,
      input.billingEmail ?? null,
      input.billingPhone ?? null,
      input.address ?? null,
    ]
  );
  return result.rows[0];
};

export const listHouseholds = async (actor: Actor): Promise<unknown[]> => {
  assertAdmin(actor);
  const result = await tenantQuery(actor.tenantId,
    `SELECT h.*,
       COALESCE(
         jsonb_agg(
           DISTINCT jsonb_build_object(
             'id', g.id, 'firstName', g.first_name, 'lastName', g.last_name,
             'email', g.email, 'userId', g.user_id
           )
         ) FILTER (WHERE g.id IS NOT NULL),
         '[]'::jsonb
       ) AS guardians
     FROM households h
     LEFT JOIN guardians g ON g.household_id = h.id AND g.tenant_id = h.tenant_id
     WHERE h.tenant_id = $1
     GROUP BY h.id ORDER BY h.name`,
    [actor.tenantId]
  );
  return result.rows;
};

export const createGuardian = async (
  actor: Actor,
  input: DomainResourceInput
): Promise<unknown> => {
  assertAdmin(actor);
  const result = await tenantQuery(actor.tenantId,
    `INSERT INTO guardians
       (tenant_id, household_id, user_id, first_name, last_name, email, phone, is_primary)
     SELECT $1, h.id, u.id, $4, $5, $6, $7, $8
     FROM households h
     LEFT JOIN users u ON u.id = $3 AND u.tenant_id = $1
     WHERE h.id = $2 AND h.tenant_id = $1
       AND ($3::uuid IS NULL OR u.id IS NOT NULL)
     RETURNING guardians.*`,
    [
      actor.tenantId,
      input.householdId,
      input.userId ?? null,
      input.firstName,
      input.lastName,
      input.email ?? null,
      input.phone ?? null,
      input.isPrimary ?? false,
    ]
  );
  if (!result.rows[0]) throw new Error('NOT_FOUND: Hogar o usuario no encontrado');
  return result.rows[0];
};

export const linkGuardianPlayer = async (
  actor: Actor,
  input: DomainResourceInput
): Promise<unknown> => {
  assertAdmin(actor);
  const result = await tenantQuery(actor.tenantId,
    `INSERT INTO guardian_players
       (tenant_id, guardian_id, player_id, relationship, can_view_finances, can_submit_payments)
     SELECT $1, g.id, p.id, $4, $5, $6
     FROM guardians g, players p
     WHERE g.id = $2 AND g.tenant_id = $1 AND p.id = $3 AND p.tenant_id = $1
     ON CONFLICT (guardian_id, player_id) DO UPDATE SET
       relationship = EXCLUDED.relationship,
       can_view_finances = EXCLUDED.can_view_finances,
       can_submit_payments = EXCLUDED.can_submit_payments
     RETURNING guardian_players.*`,
    [
      actor.tenantId,
      input.guardianId,
      input.playerId,
      input.relationship,
      input.canViewFinances ?? true,
      input.canSubmitPayments ?? true,
    ]
  );
  if (!result.rows[0]) throw new Error('NOT_FOUND: Tutor o jugador no encontrado');
  return result.rows[0];
};

export const assignCoachTeam = async (
  actor: Actor,
  input: DomainResourceInput
): Promise<unknown> => {
  assertAdmin(actor);
  const result = await tenantQuery(actor.tenantId,
    `INSERT INTO coach_team_assignments
       (tenant_id, coach_id, team_id, season_id, role, starts_on, ends_on)
     SELECT $1, c.id, t.id, s.id, $5, $6, $7
     FROM coaches c
     JOIN teams t ON t.id = $3 AND t.tenant_id = $1
     LEFT JOIN seasons s ON s.id = $4 AND s.tenant_id = $1
     WHERE c.id = $2 AND c.tenant_id = $1
       AND ($4::uuid IS NULL OR s.id IS NOT NULL)
     RETURNING coach_team_assignments.*`,
    [
      actor.tenantId,
      input.coachId,
      input.teamId,
      input.seasonId ?? null,
      input.role ?? 'coach',
      input.startsOn ?? null,
      input.endsOn ?? null,
    ]
  );
  if (!result.rows[0]) throw new Error('NOT_FOUND: Entrenador, equipo o temporada no encontrado');
  return result.rows[0];
};

export const createConsent = async (
  actor: Actor,
  input: DomainResourceInput
): Promise<unknown> => {
  const playerId = typeof input.playerId === 'string' ? input.playerId : '';
  if (!playerId || !(await guardianOwnsPlayer(actor, playerId))) {
    throw new Error('FORBIDDEN: Sin acceso al jugador');
  }
  const result = await tenantQuery(actor.tenantId,
    `INSERT INTO consents
       (tenant_id, player_id, guardian_id, consent_type, status, version, granted_at, metadata)
     SELECT $1, p.id, g.id, $4, $5, $6,
       CASE WHEN $5 = 'granted' THEN NOW() ELSE NULL END, $7::jsonb
     FROM players p
     LEFT JOIN guardians g ON g.id = $3 AND g.tenant_id = $1
     WHERE p.id = $2 AND p.tenant_id = $1
       AND ($3::uuid IS NULL OR g.id IS NOT NULL)
     RETURNING consents.*`,
    [
      actor.tenantId,
      input.playerId,
      input.guardianId ?? null,
      input.consentType,
      input.status ?? 'pending',
      input.version,
      JSON.stringify(input.metadata ?? {}),
    ]
  );
  if (!result.rows[0]) throw new Error('NOT_FOUND: Jugador o tutor no encontrado');
  return result.rows[0];
};

export const createDocument = async (
  actor: Actor,
  input: DomainResourceInput
): Promise<unknown> => {
  const playerId = typeof input.playerId === 'string' ? input.playerId : '';
  if (!isAdmin(actor) && (!playerId || !(await guardianOwnsPlayer(actor, playerId)))) {
    throw new Error('FORBIDDEN: Sin acceso al documento');
  }
  const result = await tenantQuery(actor.tenantId,
    `INSERT INTO documents
       (tenant_id, player_id, guardian_id, document_type, storage_key,
        original_filename, mime_type, size_bytes, uploaded_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      actor.tenantId,
      input.playerId ?? null,
      input.guardianId ?? null,
      input.documentType,
      input.storageKey,
      input.originalFilename ?? null,
      input.mimeType ?? null,
      input.sizeBytes ?? null,
      actor.userId,
    ]
  );
  return result.rows[0];
};

export const listNotifications = async (actor: Actor): Promise<unknown[]> => {
  const admin = isAdmin(actor);
  const result = await tenantQuery(actor.tenantId,
    `SELECT * FROM notifications
     WHERE tenant_id = $1 AND ($2::boolean OR user_id = $3)
     ORDER BY created_at DESC LIMIT 100`,
    [actor.tenantId, admin, actor.userId]
  );
  return result.rows;
};

export const createNotification = async (
  actor: Actor,
  input: DomainResourceInput
): Promise<unknown> => {
  assertAdmin(actor);
  const result = await tenantQuery(actor.tenantId,
    `INSERT INTO notifications
       (tenant_id, user_id, household_id, channel, subject, body, scheduled_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      actor.tenantId,
      input.userId ?? null,
      input.householdId ?? null,
      input.channel,
      input.subject ?? null,
      input.body,
      input.scheduledAt ?? null,
    ]
  );
  return result.rows[0];
};
