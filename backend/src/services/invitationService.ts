import { TransactionClient, withTenantTransaction } from '../utils/db';
import { sendEmail } from './emailService';
import { v4 as uuidv4 } from 'uuid';

const TENANT_TOKEN_PATTERN =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\./i;

export const getInvitationTenantId = (token: string): string | null =>
  token.match(TENANT_TOKEN_PATTERN)?.[1] ?? null;

export const createInvitation = async (tenantId: string, email: string, rol: string) =>
  withTenantTransaction(tenantId, async (client) => {
  // Verifica que el email no exista ya en users para ese tenant
  const userExists = await client.query(
    'SELECT 1 FROM users WHERE email = $1 AND tenant_id = $2',
    [email, tenantId]
  );
  if ((userExists.rowCount ?? 0) > 0) {
    throw new Error('El usuario ya existe en este tenant');
  }
  // Genera token y expiración
  const token = `${tenantId}.${uuidv4()}`;
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
  // Inserta invitación
  await client.query(
    `INSERT INTO invitations (tenant_id, email, rol, token, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [tenantId, email, rol, token, expiresAt]
  );
  // Envía email (mock)
  const link = `https://tusitio.com/registro?token=${token}&tenantId=${tenantId}`;
  await sendEmail(email, 'Invitación a Futbol Clinic', `Regístrate aquí: <a href="${link}">${link}</a>`);
  return { token };
  });

export const validateInvitationWithClient = async (
  client: TransactionClient,
  tenantId: string,
  token: string
) => {
  const result = await client.query(
    `SELECT * FROM invitations
     WHERE token = $1 AND tenant_id = $2 AND expires_at > NOW() AND accepted = FALSE`,
    [token, tenantId]
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
  id: string
) => {
  await client.query(
    'UPDATE invitations SET accepted = TRUE WHERE id = $1 AND tenant_id = $2',
    [id, tenantId]
  );
};

export const markInvitationAccepted = async (tenantId: string, id: string) =>
  withTenantTransaction(tenantId, (client) =>
    markInvitationAcceptedWithClient(client, tenantId, id)
  );