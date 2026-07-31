import { pool, TransactionClient, withTenantTransaction } from '../utils/db';
import { hashPassword, comparePassword } from '../utils/hash';
import * as invitationService from './invitationService';
import * as jwtUtil from '../utils/jwt';
import { v4 as uuidv4 } from 'uuid';
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
    await invitationService.markInvitationAcceptedWithClient(client, tenantId, invitation.id);
    const user = result.rows[0];
    const tokenJwt = jwtUtil.sign({ userId: user.id, tenantId: user.tenant_id, role: user.rol });
    return { jwt: tokenJwt };
  });
};

export const login = async (email: string, password: string, tenantId: string) => {
  return withTenantTransaction(tenantId, async (client) => {
    const result = await client.query(
      `SELECT id, tenant_id, rol, password_hash
       FROM users
       WHERE email = $1 AND tenant_id = $2 AND is_active = TRUE`,
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
     WHERE LOWER(slug) = LOWER($1) AND login_enabled = TRUE`,
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

export const forgotPassword = async (email: string, tenantId: string) => {
  const token = await withTenantTransaction(tenantId, async (client) => {
    const result = await client.query(
      'SELECT id FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenantId]
    );
    if (result.rowCount === 0) throw new Error('Usuario no encontrado');
    const resetToken = `${tenantId}.${uuidv4()}`;
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    await client.query(
      `UPDATE users SET reset_token = $1, reset_token_expires = $2
       WHERE id = $3 AND tenant_id = $4`,
      [resetToken, expires, result.rows[0].id, tenantId]
    );
    return resetToken;
  });
  // Envía email (mock)
  const link = `https://tusitio.com/reset-password?token=${token}`;
  await sendEmail(email, 'Recupera tu contraseña', `Restablece tu contraseña aquí: <a href="${link}">${link}</a>`);
  return { message: 'Email enviado' };
};

export const resetPassword = async (
  requestedTenantId: string | undefined,
  token: string,
  newPassword: string
) => {
  const tenantId = requestedTenantId ?? invitationService.getInvitationTenantId(token);
  if (!tenantId) throw new Error('Tenant requerido para restablecer la contraseña');
  const passwordHash = await hashPassword(newPassword);
  return withTenantTransaction(tenantId, async (client) => {
    const result = await client.query(
      `UPDATE users
       SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL
       WHERE reset_token = $2 AND reset_token_expires > NOW() AND tenant_id = $3
       RETURNING id`,
      [passwordHash, token, tenantId]
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