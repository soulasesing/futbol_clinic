import { pool } from '../utils/db';
import { hashPassword, comparePassword } from '../utils/hash';
import * as invitationService from './invitationService';
import * as jwtUtil from '../utils/jwt';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from './emailService';

export const registerViaInvitation = async (token: string, nombre: string, password: string) => {
  // Valida invitación
  const invitation = await invitationService.validateInvitation(token);
  // Hashea password
  const passwordHash = await hashPassword(password);
  // Crea usuario
  const result = await pool.query(
    `INSERT INTO users (tenant_id, nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, tenant_id, rol`,
    [invitation.tenant_id, nombre, invitation.email, passwordHash, invitation.rol]
  );
  // Marca invitación como aceptada
  await invitationService.markInvitationAccepted(invitation.id);
  // Genera JWT
  const user = result.rows[0];
  const tokenJwt = jwtUtil.sign({ userId: user.id, tenantId: user.tenant_id, role: user.rol });
  return { jwt: tokenJwt };
};

export const login = async (email: string, password: string, tenantId: string) => {
  const result = await pool.query(
    `SELECT id, tenant_id, rol, password_hash FROM users WHERE email = $1 AND tenant_id = $2 AND is_active = TRUE`,
    [email, tenantId]
  );
  if (result.rowCount === 0) throw new Error('Usuario o contraseña incorrectos');
  const user = result.rows[0];
  const valid = await comparePassword(password, user.password_hash);
  if (!valid) throw new Error('Usuario o contraseña incorrectos');
  const tokenJwt = jwtUtil.sign({ userId: user.id, tenantId: user.tenant_id, role: user.rol });
  return { jwt: tokenJwt };
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
  // Busca usuario
  const result = await pool.query(
    'SELECT id FROM users WHERE email = $1 AND tenant_id = $2',
    [email, tenantId]
  );
  if (result.rowCount === 0) throw new Error('Usuario no encontrado');
  const user = result.rows[0];
  // Genera token y expiración
  const token = uuidv4();
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1h
  await pool.query(
    'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
    [token, expires, user.id]
  );
  // Envía email (mock)
  const link = `https://tusitio.com/reset-password?token=${token}`;
  await sendEmail(email, 'Recupera tu contraseña', `Restablece tu contraseña aquí: <a href="${link}">${link}</a>`);
  return { message: 'Email enviado' };
};

export const resetPassword = async (token: string, newPassword: string) => {
  // Valida token
  const result = await pool.query(
    'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
    [token]
  );
  if (result.rowCount === 0) throw new Error('Token inválido o expirado');
  const user = result.rows[0];
  // Hashea y actualiza password
  const passwordHash = await hashPassword(newPassword);
  await pool.query(
    'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
    [passwordHash, user.id]
  );
  return { message: 'Contraseña actualizada' };
}; 