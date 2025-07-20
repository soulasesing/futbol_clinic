import { pool } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../utils/hash';
import { sendEmail } from './emailService';

export const getTenants = async () => {
  // Traer nombre del responsable (usuario admin) para cada tenant
  const result = await pool.query(`
    SELECT t.id, t.nombre, t.email_contacto, t.logo_url, t.banner_url,
      (SELECT u.nombre FROM users u WHERE u.tenant_id = t.id AND u.rol = 'admin' LIMIT 1) AS responsable_nombre
    FROM tenants t
    ORDER BY t.nombre
  `);
  return result.rows;
};

export const createTenantWithAdmin = async (data: any) => {
  const { nombre, email_contacto, logo_url, banner_url, responsable_nombre } = data;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Crear tenant
    const tenantId = uuidv4();
    await client.query(
      `INSERT INTO tenants (id, nombre, email_contacto, logo_url, banner_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, nombre, email_contacto, logo_url, banner_url]
    );
    // Crear usuario responsable (admin)
    const password = Math.random().toString(36).slice(-8); // Contraseña temporal
    const passwordHash = await hashPassword(password);
    const userId = uuidv4();
    await client.query(
      `INSERT INTO users (id, tenant_id, nombre, email, password_hash, rol, is_active)
       VALUES ($1, $2, $3, $4, $5, 'admin', TRUE)`,
      [userId, tenantId, responsable_nombre, email_contacto, passwordHash]
    );
    await client.query('COMMIT');
    // Enviar email al responsable
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000/login';
    await sendEmail(
      email_contacto,
      'Alta de escuela en Futbol Clinic',
      `<h2>¡Bienvenido a Futbol Clinic!</h2>
      <p>Tu escuela <b>${nombre}</b> ha sido dada de alta.</p>
      <p>Usuario: <b>${email_contacto}</b><br>Contraseña temporal: <b>${password}</b></p>
      <p>Puedes iniciar sesión aquí: <a href="${loginUrl}">${loginUrl}</a></p>`
    );
    return { tenantId, userId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const updateTenant = async (id: string, data: any) => {
  const { nombre, email_contacto, logo_url, banner_url, responsable_nombre } = data;
  // Actualizar tenant
  const result = await pool.query(
    `UPDATE tenants SET nombre = $1, email_contacto = $2, logo_url = $3, banner_url = $4 WHERE id = $5 RETURNING *`,
    [nombre, email_contacto, logo_url, banner_url, id]
  );
  if (result.rowCount === 0) throw new Error('Escuela no encontrada');
  // Actualizar nombre del responsable (usuario admin)
  if (responsable_nombre) {
    await pool.query(
      `UPDATE users SET nombre = $1 WHERE tenant_id = $2 AND rol = 'admin'`,
      [responsable_nombre, id]
    );
  }
  return result.rows[0];
};

export const deleteTenant = async (id: string) => {
  const result = await pool.query('DELETE FROM tenants WHERE id = $1', [id]);
  if (result.rowCount === 0) throw new Error('Escuela no encontrada');
};

export const getTenantDetail = async (tenantId: string) => {
  // Equipos
  const teamsRes = await pool.query('SELECT id, nombre FROM teams WHERE tenant_id = $1', [tenantId]);
  // Jugadores
  const playersRes = await pool.query('SELECT COUNT(*) FROM players WHERE tenant_id = $1', [tenantId]);
  // Entrenadores
  const coachesRes = await pool.query('SELECT COUNT(*) FROM coaches WHERE tenant_id = $1', [tenantId]);
  // Nombre del responsable
  const responsableRes = await pool.query(
    `SELECT nombre FROM users WHERE tenant_id = $1 AND rol = 'admin' LIMIT 1`,
    [tenantId]
  );
  return {
    equipos: teamsRes.rows,
    cantidad_jugadores: Number(playersRes.rows[0].count),
    cantidad_entrenadores: Number(coachesRes.rows[0].count),
    responsable_nombre: responsableRes.rows[0]?.nombre || '',
  };
}; 