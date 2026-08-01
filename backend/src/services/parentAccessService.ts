import { createHash, randomBytes } from 'node:crypto';
import { PoolClient } from 'pg';
import { pool, withTenantTransaction } from '../utils/db';
import { sendEmail } from './emailService';

export interface ParentActor {
  userId: string;
  tenantId: string;
  role: string;
}

export interface ParentInviteInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  relationship: string;
  playerIds: string[];
  householdId?: string;
  householdName?: string;
  canViewFinances: boolean;
  canSubmitPayments: boolean;
}

export interface ParentUpdateInput {
  firstName: string;
  lastName: string;
  phone?: string;
  relationship: string;
  playerIds: string[];
  canViewFinances: boolean;
  canSubmitPayments: boolean;
}

interface InvitationDraft {
  invitationId: string;
  invitationLink: string;
  email: string;
  academyName: string;
  expiresAt: Date;
}

const TOKEN_PATTERN =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\./i;

const assertAdmin = (actor: ParentActor): void => {
  if (actor.role !== 'admin') {
    throw new Error('FORBIDDEN: Solo un administrador puede gestionar familias');
  }
};

const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

const audit = (
  client: PoolClient,
  actor: ParentActor,
  action: string,
  entityId: string,
  metadata: Record<string, unknown> = {}
) => client.query(
  `INSERT INTO audit_events
     (tenant_id, actor_user_id, action, entity_type, entity_id, metadata)
   VALUES ($1, $2, $3, 'guardian', $4, $5)`,
  [actor.tenantId, actor.userId, action, entityId, metadata]
);

const linkPlayers = async (
  client: PoolClient,
  tenantId: string,
  guardianId: string,
  input: Pick<
    ParentInviteInput,
    'playerIds' | 'relationship' | 'canViewFinances' | 'canSubmitPayments'
  >,
  replaceExisting: boolean
): Promise<void> => {
  const players = await client.query(
    `SELECT id FROM players WHERE tenant_id = $1 AND id = ANY($2::uuid[])`,
    [tenantId, input.playerIds]
  );
  if (players.rows.length !== input.playerIds.length) {
    throw new Error('VALIDATION: Uno o más jugadores no pertenecen a esta academia');
  }
  if (replaceExisting) {
    await client.query(
      `DELETE FROM guardian_players
       WHERE tenant_id = $1 AND guardian_id = $2
         AND NOT (player_id = ANY($3::uuid[]))`,
      [tenantId, guardianId, input.playerIds]
    );
  }
  await client.query(
    `INSERT INTO guardian_players
       (tenant_id, guardian_id, player_id, relationship,
        can_view_finances, can_submit_payments)
     SELECT $1, $2, player_id, $4, $5, $6
     FROM unnest($3::uuid[]) AS player_id
     ON CONFLICT (guardian_id, player_id) DO UPDATE SET
       relationship = EXCLUDED.relationship,
       can_view_finances = EXCLUDED.can_view_finances,
       can_submit_payments = EXCLUDED.can_submit_payments`,
    [
      tenantId,
      guardianId,
      input.playerIds,
      input.relationship,
      input.canViewFinances,
      input.canSubmitPayments,
    ]
  );
};

const createInvitationDraft = async (
  client: PoolClient,
  actor: ParentActor,
  guardianId: string,
  email: string
): Promise<InvitationDraft> => {
  const tenantResult = await client.query(
    'SELECT nombre, slug FROM tenants WHERE id = $1',
    [actor.tenantId]
  );
  const tenant = tenantResult.rows[0];
  if (!tenant?.slug) throw new Error('VALIDATION: La academia no tiene una URL configurada');

  await client.query(
    `UPDATE invitations
     SET revoked_at = NOW()
     WHERE tenant_id = $1 AND guardian_id = $2
       AND accepted = FALSE AND revoked_at IS NULL`,
    [actor.tenantId, guardianId]
  );

  const rawToken = `${actor.tenantId}.${randomBytes(32).toString('base64url')}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const result = await client.query(
    `INSERT INTO invitations
       (tenant_id, email, rol, token, expires_at, guardian_id, created_by, sent_at)
     VALUES ($1, $2, 'parent', $3, $4, $5, $6, NOW())
     RETURNING id`,
    [
      actor.tenantId,
      email,
      hashToken(rawToken),
      expiresAt,
      guardianId,
      actor.userId,
    ]
  );
  const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  if (!frontendUrl) throw new Error('FRONTEND_URL no está configurado');
  return {
    invitationId: result.rows[0].id,
    invitationLink:
      `${frontendUrl}/escuela/${encodeURIComponent(tenant.slug)}/registro`
      + `?token=${encodeURIComponent(rawToken)}`,
    email,
    academyName: tenant.nombre,
    expiresAt,
  };
};

const deliverInvitation = async (
  draft: InvitationDraft
): Promise<{ emailSent: boolean; invitationLink: string; expiresAt: Date }> => {
  try {
    await sendEmail(
      draft.email,
      `Invitación al portal familiar de ${draft.academyName}`,
      `<p>Has sido invitado al portal familiar de <strong>${draft.academyName}</strong>.</p>
       <p><a href="${draft.invitationLink}">Crear mi contraseña</a></p>
       <p>Este enlace es personal, de un solo uso y vence en 24 horas.</p>`
    );
    return {
      emailSent: true,
      invitationLink: draft.invitationLink,
      expiresAt: draft.expiresAt,
    };
  } catch {
    return {
      emailSent: false,
      invitationLink: draft.invitationLink,
      expiresAt: draft.expiresAt,
    };
  }
};

export const listParents = async (actor: ParentActor): Promise<unknown[]> => {
  assertAdmin(actor);
  return withTenantTransaction(actor.tenantId, async (client) => {
    const result = await client.query(
      `SELECT g.id, g.household_id, g.first_name, g.last_name, g.email, g.phone,
              g.is_primary, u.id AS user_id, u.is_active,
              h.name AS household_name,
              COALESCE(
                jsonb_agg(
                  DISTINCT jsonb_build_object(
                    'id', p.id,
                    'name', concat_ws(' ', p.nombre, p.apellido),
                    'relationship', gp.relationship,
                    'canViewFinances', gp.can_view_finances,
                    'canSubmitPayments', gp.can_submit_payments
                  )
                ) FILTER (WHERE p.id IS NOT NULL),
                '[]'::jsonb
              ) AS children,
              invitation.id AS invitation_id,
              invitation.expires_at AS invitation_expires_at,
              CASE
                WHEN u.id IS NOT NULL AND u.is_active = TRUE THEN 'active'
                WHEN u.id IS NOT NULL AND u.is_active = FALSE THEN 'suspended'
                WHEN invitation.id IS NULL THEN 'not_invited'
                WHEN invitation.revoked_at IS NOT NULL THEN 'revoked'
                WHEN invitation.expires_at <= NOW() THEN 'expired'
                ELSE 'pending'
              END AS access_status
       FROM guardians g
       JOIN households h
         ON h.id = g.household_id AND h.tenant_id = g.tenant_id
       LEFT JOIN users u
         ON u.id = g.user_id AND u.tenant_id = g.tenant_id
       LEFT JOIN guardian_players gp
         ON gp.guardian_id = g.id AND gp.tenant_id = g.tenant_id
       LEFT JOIN players p
         ON p.id = gp.player_id AND p.tenant_id = gp.tenant_id
       LEFT JOIN LATERAL (
         SELECT i.id, i.expires_at, i.revoked_at
         FROM invitations i
         WHERE i.tenant_id = g.tenant_id AND i.guardian_id = g.id
           AND i.accepted = FALSE
         ORDER BY i.created_at DESC
         LIMIT 1
       ) invitation ON TRUE
       WHERE g.tenant_id = $1
       GROUP BY g.id, h.name, u.id, u.is_active, invitation.id,
                invitation.expires_at, invitation.revoked_at
       ORDER BY g.last_name, g.first_name`,
      [actor.tenantId]
    );
    return result.rows;
  });
};

export const inviteParent = async (
  actor: ParentActor,
  input: ParentInviteInput
): Promise<unknown> => {
  assertAdmin(actor);
  const email = input.email.trim().toLowerCase();
  const result = await withTenantTransaction(actor.tenantId, async (client) => {
    const existingUser = await client.query(
      `SELECT id, rol FROM users
       WHERE tenant_id = $1 AND LOWER(email) = $2
       FOR UPDATE`,
      [actor.tenantId, email]
    );
    if (existingUser.rows[0] && existingUser.rows[0].rol !== 'parent') {
      throw new Error('VALIDATION: Este correo ya pertenece a otro rol');
    }

    let guardian = await client.query(
      `SELECT id, household_id, user_id FROM guardians
       WHERE tenant_id = $1 AND LOWER(email) = $2
       ORDER BY created_at LIMIT 1 FOR UPDATE`,
      [actor.tenantId, email]
    );
    let householdId = input.householdId;
    if (!guardian.rows[0]) {
      if (!householdId) {
        const household = await client.query(
          `INSERT INTO households
             (tenant_id, name, billing_email, billing_phone)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [
            actor.tenantId,
            input.householdName || `Familia ${input.lastName}`,
            email,
            input.phone ?? null,
          ]
        );
        householdId = household.rows[0].id;
      }
      guardian = await client.query(
        `INSERT INTO guardians
           (tenant_id, household_id, user_id, first_name, last_name,
            email, phone, is_primary)
         SELECT $1, h.id, $3, $4, $5, $6, $7, TRUE
         FROM households h
         WHERE h.id = $2 AND h.tenant_id = $1
         RETURNING guardians.id, guardians.household_id, guardians.user_id`,
        [
          actor.tenantId,
          householdId,
          existingUser.rows[0]?.id ?? null,
          input.firstName,
          input.lastName,
          email,
          input.phone ?? null,
        ]
      );
      if (!guardian.rows[0]) throw new Error('NOT_FOUND: Familia no encontrada');
    }

    const guardianId = guardian.rows[0].id as string;
    await client.query(
      `UPDATE guardians SET first_name = $1, last_name = $2, phone = $3
       WHERE id = $4 AND tenant_id = $5`,
      [input.firstName, input.lastName, input.phone ?? null, guardianId, actor.tenantId]
    );
    await linkPlayers(client, actor.tenantId, guardianId, input, false);

    if (existingUser.rows[0]) {
      await client.query(
        `UPDATE guardians SET user_id = $1
         WHERE id = $2 AND tenant_id = $3`,
        [existingUser.rows[0].id, guardianId, actor.tenantId]
      );
      await audit(client, actor, 'parent.access.link', guardianId);
      return { guardianId, existingUser: true };
    }

    const draft = await createInvitationDraft(client, actor, guardianId, email);
    await audit(client, actor, 'parent.invitation.create', guardianId, {
      invitationId: draft.invitationId,
    });
    return { guardianId, existingUser: false, draft };
  });

  if (result.existingUser || !result.draft) return result;
  return {
    guardianId: result.guardianId,
    existingUser: false,
    ...(await deliverInvitation(result.draft)),
  };
};

export const resendInvitation = async (
  actor: ParentActor,
  guardianId: string
): Promise<unknown> => {
  assertAdmin(actor);
  const draft = await withTenantTransaction(actor.tenantId, async (client) => {
    const guardian = await client.query(
      `SELECT email, user_id FROM guardians
       WHERE tenant_id = $1 AND id = $2 FOR UPDATE`,
      [actor.tenantId, guardianId]
    );
    if (!guardian.rows[0]) throw new Error('NOT_FOUND: Tutor no encontrado');
    if (guardian.rows[0].user_id) {
      throw new Error('VALIDATION: Esta persona ya activó su cuenta');
    }
    if (!guardian.rows[0].email) throw new Error('VALIDATION: El tutor no tiene correo');
    const invitation = await createInvitationDraft(
      client,
      actor,
      guardianId,
      guardian.rows[0].email
    );
    await audit(client, actor, 'parent.invitation.resend', guardianId, {
      invitationId: invitation.invitationId,
    });
    return invitation;
  });
  return deliverInvitation(draft);
};

export const revokeInvitation = async (
  actor: ParentActor,
  guardianId: string
): Promise<void> => {
  assertAdmin(actor);
  await withTenantTransaction(actor.tenantId, async (client) => {
    const result = await client.query(
      `UPDATE invitations SET revoked_at = NOW()
       WHERE tenant_id = $1 AND guardian_id = $2
         AND accepted = FALSE AND revoked_at IS NULL`,
      [actor.tenantId, guardianId]
    );
    if (result.rowCount === 0) throw new Error('NOT_FOUND: Invitación activa no encontrada');
    await audit(client, actor, 'parent.invitation.revoke', guardianId);
  });
};

export const updateParent = async (
  actor: ParentActor,
  guardianId: string,
  input: ParentUpdateInput
): Promise<void> => {
  assertAdmin(actor);
  await withTenantTransaction(actor.tenantId, async (client) => {
    const result = await client.query(
      `UPDATE guardians
       SET first_name = $1, last_name = $2, phone = $3
       WHERE id = $4 AND tenant_id = $5`,
      [
        input.firstName,
        input.lastName,
        input.phone ?? null,
        guardianId,
        actor.tenantId,
      ]
    );
    if (result.rowCount === 0) throw new Error('NOT_FOUND: Tutor no encontrado');
    await linkPlayers(client, actor.tenantId, guardianId, input, true);
    await audit(client, actor, 'parent.access.update', guardianId);
  });
};

export const setParentAccess = async (
  actor: ParentActor,
  guardianId: string,
  active: boolean
): Promise<void> => {
  assertAdmin(actor);
  await withTenantTransaction(actor.tenantId, async (client) => {
    const result = await client.query(
      `UPDATE users u SET is_active = $1
       FROM guardians g
       WHERE g.id = $2 AND g.tenant_id = $3
         AND g.user_id = u.id AND u.tenant_id = g.tenant_id
         AND u.rol = 'parent'
       RETURNING u.id`,
      [active, guardianId, actor.tenantId]
    );
    if (result.rowCount === 0) throw new Error('NOT_FOUND: Cuenta de padre no encontrada');
    await audit(
      client,
      actor,
      active ? 'parent.access.activate' : 'parent.access.suspend',
      guardianId
    );
  });
};

export const getInvitationInfo = async (
  token: string
): Promise<Record<string, unknown> | null> => {
  const tenantId = TOKEN_PATTERN.exec(token)?.[1];
  if (!tenantId) return null;
  const tenant = await pool.query(
    `SELECT id, nombre, slug, logo_url, primary_color, secondary_color
     FROM tenants
     WHERE id = $1 AND status = 'active' AND login_enabled = TRUE`,
    [tenantId]
  );
  if (!tenant.rows[0]) return null;
  return withTenantTransaction(tenantId, async (client) => {
    const invitation = await client.query(
      `SELECT i.email, i.expires_at, g.first_name, g.last_name
       FROM invitations i
       JOIN guardians g
         ON g.id = i.guardian_id AND g.tenant_id = i.tenant_id
       WHERE i.tenant_id = $1 AND i.token = $2 AND i.rol = 'parent'
         AND i.accepted = FALSE AND i.revoked_at IS NULL
         AND i.expires_at > NOW()`,
      [tenantId, hashToken(token)]
    );
    if (!invitation.rows[0]) return null;
    return {
      tenant: {
        name: tenant.rows[0].nombre,
        slug: tenant.rows[0].slug,
        logoUrl: tenant.rows[0].logo_url,
        primaryColor: tenant.rows[0].primary_color,
        secondaryColor: tenant.rows[0].secondary_color,
      },
      parent: {
        firstName: invitation.rows[0].first_name,
        lastName: invitation.rows[0].last_name,
        email: invitation.rows[0].email,
      },
      expiresAt: invitation.rows[0].expires_at,
    };
  });
};
