import { pool } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../utils/hash';
import { sendEmail } from './emailService';

export const getTenants = async () => {
  // Traer todos los campos relevantes del tenant
  const result = await pool.query(`
    SELECT t.id, t.nombre, t.email_contacto, t.logo_url, t.banner_url,
      t.foundation_date, t.description, t.slogan, t.telefono, t.email,
      t.facebook_url, t.instagram_url, t.twitter_url, t.youtube_url, t.tiktok_url,
      t.primary_color, t.secondary_color,
      (SELECT u.nombre FROM users u WHERE u.tenant_id = t.id AND u.rol = 'admin' LIMIT 1) AS responsable_nombre
    FROM tenants t
    ORDER BY t.nombre
  `);
  return result.rows;
};

export const createTenantWithAdmin = async (data: any) => {
  const {
    nombre, email_contacto, logo_url, banner_url, responsable_nombre,
    foundation_date, description, slogan, telefono, email,
    facebook_url, instagram_url, twitter_url, youtube_url, tiktok_url,
    primary_color, secondary_color
  } = data;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Crear tenant
    const tenantId = uuidv4();
    await client.query(
      `INSERT INTO tenants (id, nombre, email_contacto, logo_url, banner_url, foundation_date, description, slogan, telefono, email, facebook_url, instagram_url, twitter_url, youtube_url, tiktok_url, primary_color, secondary_color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [tenantId, nombre, email_contacto, logo_url, banner_url, foundation_date, description, slogan, telefono, email, facebook_url, instagram_url, twitter_url, youtube_url, tiktok_url, primary_color, secondary_color]
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
  const {
    nombre, email_contacto, logo_url, banner_url, responsable_nombre,
    foundation_date, description, slogan, telefono, email,
    facebook_url, instagram_url, twitter_url, youtube_url, tiktok_url,
    primary_color, secondary_color
  } = data;
  // Actualizar tenant
  const result = await pool.query(
    `UPDATE tenants SET nombre = $1, email_contacto = $2, logo_url = $3, banner_url = $4, foundation_date = $5, description = $6, slogan = $7, telefono = $8, email = $9, facebook_url = $10, instagram_url = $11, twitter_url = $12, youtube_url = $13, tiktok_url = $14, primary_color = $15, secondary_color = $16 WHERE id = $17 RETURNING *`,
    [nombre, email_contacto, logo_url, banner_url, foundation_date, description, slogan, telefono, email, facebook_url, instagram_url, twitter_url, youtube_url, tiktok_url, primary_color, secondary_color, id]
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

// Admin user management functions for super admin
export const getTenantAdmins = async (tenantId: string) => {
  const result = await pool.query(
    `SELECT id, nombre, email, is_active, created_at 
     FROM users 
     WHERE tenant_id = $1 AND rol = 'admin' 
     ORDER BY created_at DESC`,
    [tenantId]
  );
  return result.rows;
};

export const createTenantAdmin = async (tenantId: string, data: { nombre: string; email: string; password: string }) => {
  const { nombre, email, password } = data;
  
  if (!nombre || !email || !password) {
    throw new Error('Nombre, email y contraseña son requeridos');
  }
  
  if (password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }
  
  // Check if email already exists for this tenant
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1 AND tenant_id = $2',
    [email, tenantId]
  );
  
  if (existingUser.rowCount && existingUser.rowCount > 0) {
    throw new Error('Ya existe un usuario con este email en esta escuela');
  }
  
  const passwordHash = await hashPassword(password);
  const userId = uuidv4();
  
  const result = await pool.query(
    `INSERT INTO users (id, tenant_id, nombre, email, password_hash, rol, is_active)
     VALUES ($1, $2, $3, $4, $5, 'admin', TRUE)
     RETURNING id, nombre, email, is_active, created_at`,
    [userId, tenantId, nombre, email, passwordHash]
  );
  
  return result.rows[0];
};

export const updateTenantAdmin = async (tenantId: string, adminId: string, data: { nombre?: string; email?: string; password?: string; is_active?: boolean }) => {
  // Verify admin belongs to this tenant
  const adminCheck = await pool.query(
    'SELECT id FROM users WHERE id = $1 AND tenant_id = $2 AND rol = $3',
    [adminId, tenantId, 'admin']
  );
  
  if (!adminCheck.rowCount || adminCheck.rowCount === 0) {
    throw new Error('Administrador no encontrado');
  }
  
  const setClause = [];
  const values = [];
  let paramCount = 1;
  
  if (data.nombre !== undefined) {
    setClause.push(`nombre = $${paramCount}`);
    values.push(data.nombre);
    paramCount++;
  }
  
  if (data.email !== undefined) {
    // Check if email is already taken by another user in this tenant
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND tenant_id = $2 AND id != $3',
      [data.email, tenantId, adminId]
    );
    
    if (emailCheck.rowCount && emailCheck.rowCount > 0) {
      throw new Error('Este email ya está en uso por otro usuario');
    }
    
    setClause.push(`email = $${paramCount}`);
    values.push(data.email);
    paramCount++;
  }
  
  if (data.password !== undefined) {
    if (data.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
    const passwordHash = await hashPassword(data.password);
    setClause.push(`password_hash = $${paramCount}`);
    values.push(passwordHash);
    paramCount++;
  }
  
  if (data.is_active !== undefined) {
    setClause.push(`is_active = $${paramCount}`);
    values.push(data.is_active);
    paramCount++;
  }
  
  if (setClause.length === 0) {
    throw new Error('No hay datos para actualizar');
  }
  
  values.push(adminId, tenantId);
  
  const query = `
    UPDATE users 
    SET ${setClause.join(', ')}
    WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1} AND rol = 'admin'
    RETURNING id, nombre, email, is_active, created_at
  `;
  
  const result = await pool.query(query, values);
  
  if (!result.rowCount || result.rowCount === 0) {
    throw new Error('Error al actualizar administrador');
  }
  
  return result.rows[0];
};

export const deleteTenantAdmin = async (tenantId: string, adminId: string) => {
  // Verify admin belongs to this tenant
  const adminCheck = await pool.query(
    'SELECT id FROM users WHERE id = $1 AND tenant_id = $2 AND rol = $3',
    [adminId, tenantId, 'admin']
  );
  
  if (!adminCheck.rowCount || adminCheck.rowCount === 0) {
    throw new Error('Administrador no encontrado');
  }
  
  // Check if this is the last active admin
  const adminCount = await pool.query(
    'SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND rol = $2 AND is_active = TRUE',
    [tenantId, 'admin']
  );
  
  if (Number(adminCount.rows[0].count) <= 1) {
    throw new Error('No se puede eliminar el último administrador activo de la escuela');
  }
  
  const result = await pool.query(
    'DELETE FROM users WHERE id = $1 AND tenant_id = $2 AND rol = $3',
    [adminId, tenantId, 'admin']
  );
  
  if (!result.rowCount || result.rowCount === 0) {
    throw new Error('Error al eliminar administrador');
  }
  
  return { message: 'Administrador eliminado correctamente' };
}; 