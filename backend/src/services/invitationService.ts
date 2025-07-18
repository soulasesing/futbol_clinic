import { pool } from '../utils/db';
import { sendEmail } from './emailService';
import { v4 as uuidv4 } from 'uuid';

export const createInvitation = async (tenantId: string, email: string, rol: string) => {
  // Verifica que el email no exista ya en users para ese tenant
  const userExists = await pool.query(
    'SELECT 1 FROM users WHERE email = $1 AND tenant_id = $2',
    [email, tenantId]
  );
  if ((userExists.rowCount ?? 0) > 0) {
    throw new Error('El usuario ya existe en este tenant');
  }
  // Genera token y expiración
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
  // Inserta invitación
  await pool.query(
    `INSERT INTO invitations (tenant_id, email, rol, token, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [tenantId, email, rol, token, expiresAt]
  );
  // Envía email (mock)
  const link = `https://tusitio.com/registro?token=${token}`;
  await sendEmail(email, 'Invitación a Futbol Clinic', `Regístrate aquí: <a href="${link}">${link}</a>`);
  return { token };
};

export const validateInvitation = async (token: string) => {
  const result = await pool.query(
    `SELECT * FROM invitations WHERE token = $1 AND expires_at > NOW() AND accepted = FALSE`,
    [token]
  );
  if (result.rowCount === 0) throw new Error('Invitación inválida o expirada');
  return result.rows[0];
};

export const markInvitationAccepted = async (id: string) => {
  await pool.query('UPDATE invitations SET accepted = TRUE WHERE id = $1', [id]);
}; 