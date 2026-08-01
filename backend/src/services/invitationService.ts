import { TransactionClient, withTenantTransaction } from '../utils/db';
import { sendEmail } from './emailService';
import { createHash, randomBytes } from 'node:crypto';

const TENANT_TOKEN_PATTERN =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\./i;

export const getInvitationTenantId = (token: string): string | null =>
  TENANT_TOKEN_PATTERN.exec(token)?.[1] ?? null;

const hashInvitationToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export const createInvitation = async (tenantId: string, email: string, rol: string) =>
  withTenantTransaction(tenantId, async (client) => {
  if (rol === 'parent') {
    throw new Error('Usa el módulo Familias para invitar representantes');
  }
  if (rol !== 'admin' && rol !== 'coach') throw new Error('Rol de invitación inválido');
  // Verifica que el email no exista ya en users para ese tenant
  const userExists = await client.query(
    'SELECT 1 FROM users WHERE email = $1 AND tenant_id = $2',
    [email, tenantId]
  );
  if ((userExists.rowCount ?? 0) > 0) {
    throw new Error('El usuario ya existe en este tenant');
  }
  // Genera token y expiración
  const token = `${tenantId}.${randomBytes(32).toString('base64url')}`;
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
  // Inserta invitación
  await client.query(
    `INSERT INTO invitations (tenant_id, email, rol, token, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [tenantId, email, rol, hashInvitationToken(token), expiresAt]
  );
  const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  if (!frontendUrl) throw new Error('FRONTEND_URL no está configurado');
  const link = `${frontendUrl}/register?token=${encodeURIComponent(token)}`;
  await sendEmail(email, 'Invitación a Futbol Clinic', `Regístrate aquí: <a href="${link}">${link}</a>`);
  return { invitationLink: link };
  });

export const validateInvitationWithClient = async (
  client: TransactionClient,
  tenantId: string,
  token: string
) => {
  const result = await client.query(
    `SELECT * FROM invitations
     WHERE token IN ($1, $2) AND tenant_id = $3 AND expires_at > NOW()
       AND accepted = FALSE AND revoked_at IS NULL`,
    [hashInvitationToken(token), token, tenantId]
  );
  if (result.rowCount === 0) throw new Error('Invitación inválida o expirada');
  return result.rows[0];
};

export const validateInvitation = async (tenantId: string, token: string) =>
  withTenantTransaction(tenantId, (client) =>
    validateInvitationWithClient(client, tenantId, token)
  );

export const markInvitationAcceptedWithClient = async (
  client: TransactionClient,
  tenantId: string,
  id: string,
  userId?: string
) => {
  await client.query(
    `UPDATE invitations
     SET accepted = TRUE, accepted_by_user_id = COALESCE($3, accepted_by_user_id)
     WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId, userId ?? null]
  );
};

export const markInvitationAccepted = async (tenantId: string, id: string) =>
  withTenantTransaction(tenantId, (client) =>
    markInvitationAcceptedWithClient(client, tenantId, id)
  );