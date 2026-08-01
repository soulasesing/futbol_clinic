import { pool, TransactionClient, withTenantTransaction } from '../utils/db';
import { hashPassword, comparePassword } from '../utils/hash';
import * as invitationService from './invitationService';
import * as jwtUtil from '../utils/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { sendEmail } from './emailService';

export const registerViaInvitation = async (
  requestedTenantId: string | undefined,
  token: string,
  nombre: string,
  password: string
) => {
  const tenantId = requestedTenantId ?? invitationService.getInvitationTenantId(token);
  if (!tenantId) throw new Error('Tenant requerido para validar la invitación');
  const passwordHash = await hashPassword(password);
  return withTenantTransaction(tenantId, async (client) => {
    const invitation = await invitationService.validateInvitationWithClient(client, tenantId, token);
    const result = await client.query(
      `INSERT INTO users (tenant_id, nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, tenant_id, rol`,
      [tenantId, nombre, invitation.email, passwordHash, invitation.rol]
    );
    const user = result.rows[0];
    if (invitation.rol === 'parent') {
      if (!invitation.guardian_id) {
        throw new Error('La invitación no está vinculada a una familia');
      }
      const guardian = await client.query(
        `UPDATE guardians SET user_id = $1
         WHERE id = $2 AND tenant_id = $3 AND user_id IS NULL
         RETURNING id`,
        [user.id, invitation.guardian_id, tenantId]
      );
      if (!guardian.rows[0]) {
        throw new Error('La invitación familiar ya fue utilizada');
      }
    }
    await invitationService.markInvitationAcceptedWithClient(
      client,
      tenantId,
      invitation.id,
      user.id
    );
    const tokenJwt = jwtUtil.sign({ userId: user.id, tenantId: user.tenant_id, role: user.rol });
    return {
      jwt: tokenJwt,
      user: {
        name: nombre,
        email: invitation.email,
        tenantId: user.tenant_id,
        role: user.rol,
      },
    };
  });
};

export const login = async (email: string, password: string, tenantId: string) => {
  return withTenantTransaction(tenantId, async (client) => {
    const result = await client.query(
      `SELECT u.id, u.tenant_id, u.rol, u.password_hash
       FROM users u
       JOIN tenants t ON t.id = u.tenant_id
       WHERE u.email = $1 AND u.tenant_id = $2 AND u.is_active = TRUE
         AND t.status = 'active' AND t.login_enabled = TRUE`,
      [email, tenantId]
    );
    if (result.rowCount === 0) throw new Error('Usuario o contraseña incorrectos');
    const user = result.rows[0];
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) throw new Error('Usuario o contraseña incorrectos');
    const tokenJwt = jwtUtil.sign({ userId: user.id, tenantId: user.tenant_id, role: user.rol });
    return { jwt: tokenJwt };
  });
};

export const loginBySlug = async (email: string, password: string, slug: string) => {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Usuario o contraseña incorrectos');
  }
  const tenantResult = await pool.query(
    `SELECT id FROM tenants
     WHERE LOWER(slug) = LOWER($1)
       AND login_enabled = TRUE AND status = 'active'`,
    [slug]
  );
  if (!tenantResult.rows[0]) throw new Error('Usuario o contraseña incorrectos');
  return login(email, password, tenantResult.rows[0].id);
};

export const loginSuperAdmin = async (email: string, password: string) => {
  const result = await pool.query(
    `SELECT id, tenant_id, rol, password_hash FROM users WHERE email = $1 AND rol = 'super_admin' AND is_active = TRUE`,
    [email]
  );
  if (result.rowCount === 0) throw new Error('Usuario o contraseña incorrectos');
  const user = result.rows[0];
  const valid = await comparePassword(password, user.password_hash);
  if (!valid) throw new Error('Usuario o contraseña incorrectos');
  const tokenJwt = jwtUtil.sign({ userId: user.id, tenantId: user.tenant_id, role: user.rol });
  return { jwt: tokenJwt };
};

export const refreshSession = (payload: jwtUtil.JwtPayload): string =>
  jwtUtil.sign({
    userId: payload.userId,
    tenantId: payload.tenantId,
    role: payload.role,
  });

const passwordResetMessage = {
  message: 'Si la cuenta existe, recibirás un enlace para restablecer tu contraseña.',
};

const hashResetToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export const forgotPassword = async (email: string, slug: string) => {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return passwordResetMessage;
  const tenantResult = await pool.query(
    `SELECT id FROM tenants
     WHERE LOWER(slug) = LOWER($1)
       AND status = 'active' AND login_enabled = TRUE`,
    [slug]
  );
  const tenantId = tenantResult.rows[0]?.id as string | undefined;
  if (!tenantId) return passwordResetMessage;

  const token = await withTenantTransaction(tenantId, async (client) => {
    const result = await client.query(
      `SELECT id FROM users
       WHERE LOWER(email) = LOWER($1) AND tenant_id = $2 AND is_active = TRUE`,
      [email.trim(), tenantId]
    );
    if (result.rowCount === 0) return null;
    const resetToken = `${tenantId}.${randomBytes(32).toString('base64url')}`;
    await client.query(
      `UPDATE users
       SET reset_token = $1, reset_token_expires = NOW() + INTERVAL '1 hour'
       WHERE id = $2 AND tenant_id = $3`,
      [hashResetToken(resetToken), result.rows[0].id, tenantId]
    );
    return resetToken;
  });
  if (!token) return passwordResetMessage;

  const configuredFrontendUrl = process.env.FRONTEND_URL;
  if (!configuredFrontendUrl) {
    throw new Error('FRONTEND_URL no está configurado');
  }
  const frontendUrl = configuredFrontendUrl.replace(/\/$/, '');
  const link =
    `${frontendUrl}/escuela/${encodeURIComponent(slug)}/reset`
    + `?token=${encodeURIComponent(token)}`;
  await sendEmail(
    email,
    'Restablece tu contraseña de Futbol Clinic',
    `<p>Recibimos una solicitud para restablecer tu contraseña.</p>
     <p><a href="${link}">Crear una nueva contraseña</a></p>
     <p>Este enlace vence en una hora. Si no hiciste la solicitud, ignora este mensaje.</p>`
  );
  return passwordResetMessage;
};

export const resetPassword = async (
  requestedTenantId: string | undefined,
  token: string,
  newPassword: string
) => {
  const tenantId = requestedTenantId ?? invitationService.getInvitationTenantId(token);
  if (!tenantId) throw new Error('Tenant requerido para restablecer la contraseña');
  const passwordHash = await hashPassword(newPassword);
  const tokenHash = hashResetToken(token);
  return withTenantTransaction(tenantId, async (client) => {
    const result = await client.query(
      `UPDATE users
       SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL
       WHERE reset_token = $2 AND reset_token_expires > NOW() AND tenant_id = $3
       RETURNING id`,
      [passwordHash, tokenHash, tenantId]
    );
    if (result.rowCount === 0) throw new Error('Token inválido o expirado');
    return { message: 'Contraseña actualizada' };
  });
};

const changePasswordWithClient = async (
  client: TransactionClient,
  userId: string,
  tenantId: string | null,
  currentPassword: string,
  newPassword: string
) => {
  // Get user's current password hash
  const result = await client.query(
    `SELECT password_hash FROM users
     WHERE id = $1 AND tenant_id IS NOT DISTINCT FROM $2`,
    [userId, tenantId]
  );
  
  if (!result.rowCount || result.rowCount === 0) {
    throw new Error('Usuario no encontrado');
  }
  
  const user = result.rows[0];
  
  // Verify current password
  const isCurrentPasswordValid = await comparePassword(currentPassword, user.password_hash);
  if (!isCurrentPasswordValid) {
    throw new Error('La contraseña actual es incorrecta');
  }
  
  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);
  
  // Update password
  await client.query(
    `UPDATE users SET password_hash = $1
     WHERE id = $2 AND tenant_id IS NOT DISTINCT FROM $3`,
    [newPasswordHash, userId, tenantId]
  );
  
  return { message: 'Contraseña actualizada exitosamente' };
};

export const changePassword = async (
  userId: string,
  tenantId: string | null,
  currentPassword: string,
  newPassword: string
) => {
  if (tenantId) {
    return withTenantTransaction(
      tenantId,
      (client) => changePasswordWithClient(client, userId, tenantId, currentPassword, newPassword)
    );
  }

  return changePasswordWithClient(pool, userId, null, currentPassword, newPassword);
}; 