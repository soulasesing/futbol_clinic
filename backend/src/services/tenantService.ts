import { pool, setLocalTenantContext, withTenantTransaction, withTransaction } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../utils/hash';
import { sendEmail } from './emailService';
import { randomBytes } from 'node:crypto';

const normalizeSlug = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const getPublicTenants = async () => {
  const result = await pool.query(
    `SELECT id, nombre, slug
     FROM tenants
     WHERE login_enabled = TRUE
     ORDER BY nombre`
  );
  return result.rows;
};

export const getPublicTenantBySlug = async (slug: string) => {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug || normalizedSlug !== slug) return null;
  const result = await pool.query(
    `SELECT slug, nombre, logo_url, banner_url, primary_color, secondary_color,
            description, slogan
     FROM tenants
     WHERE LOWER(slug) = $1 AND login_enabled = TRUE`,
    [normalizedSlug]
  );
  return result.rows[0] ?? null;
};

export const getTenants = async () => {
  const result = await pool.query(`
    SELECT t.id, t.nombre, t.email_contacto, t.logo_url, t.banner_url,
      t.foundation_date, t.description, t.slogan, t.telefono, t.email,
      t.facebook_url, t.instagram_url, t.twitter_url, t.youtube_url, t.tiktok_url,
      t.primary_color, t.secondary_color, t.slug, t.login_enabled
    FROM tenants t
    ORDER BY t.nombre
  `);

  return Promise.all(result.rows.map(async (tenant) => {
    const responsableNombre = await withTenantTransaction(tenant.id, async (client) => {
      const userResult = await client.query(
        `SELECT nombre FROM users
         WHERE tenant_id = $1 AND rol = 'admin'
         LIMIT 1`,
        [tenant.id]
      );
      return userResult.rows[0]?.nombre ?? '';
    });

    return { ...tenant, responsable_nombre: responsableNombre };
  }));
};

export const createTenantWithAdmin = async (data: any) => {
  const {
    nombre, email_contacto, logo_url, banner_url, responsable_nombre,
    foundation_date, description, slogan, telefono, email,
    facebook_url, instagram_url, twitter_url, youtube_url, tiktok_url,
    primary_color, secondary_color, slug: requestedSlug, login_enabled
  } = data;
  const result = await withTransaction(async (client) => {
    const tenantId = uuidv4();
    const slug = normalizeSlug(requestedSlug || nombre) || `escuela-${tenantId.slice(0, 12)}`;
    await client.query(
      `INSERT INTO tenants
         (id, nombre, email_contacto, logo_url, banner_url, foundation_date,
          description, slogan, telefono, email, facebook_url, instagram_url,
          twitter_url, youtube_url, tiktok_url, primary_color, secondary_color,
          slug, login_enabled)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
      [
        tenantId, nombre, email_contacto, logo_url, banner_url, foundation_date,
        description, slogan, telefono, email, facebook_url, instagram_url,
        twitter_url, youtube_url, tiktok_url, primary_color, secondary_color,
        slug, login_enabled ?? true,
      ]
    );

    await setLocalTenantContext(client, tenantId);
    const password = randomBytes(12).toString('base64url');
    const passwordHash = await hashPassword(password);
    const userId = uuidv4();
    await client.query(
      `INSERT INTO users (id, tenant_id, nombre, email, password_hash, rol, is_active)
       VALUES ($1, $2, $3, $4, $5, 'admin', TRUE)`,
      [userId, tenantId, responsable_nombre, email_contacto, passwordHash]
    );
    return { tenantId, userId, password, slug };
  });

  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const loginUrl = `${frontendUrl}/escuela/${result.slug}/login`;
  await sendEmail(
    email_contacto,
    'Alta de escuela en Futbol Clinic',
    `<h2>¡Bienvenido a Futbol Clinic!</h2>
    <p>Tu escuela <b>${nombre}</b> ha sido dada de alta.</p>
    <p>Usuario: <b>${email_contacto}</b><br>Contraseña temporal: <b>${result.password}</b></p>
    <p>Puedes iniciar sesión aquí: <a href="${loginUrl}">${loginUrl}</a></p>`
  );

  return { tenantId: result.tenantId, userId: result.userId, slug: result.slug };
};

export const updateTenant = async (id: string, data: any) => {
  const {
    nombre, email_contacto, logo_url, banner_url, responsable_nombre,
    foundation_date, description, slogan, telefono, email,
    facebook_url, instagram_url, twitter_url, youtube_url, tiktok_url,
    primary_color, secondary_color, slug, login_enabled
  } = data;
  return withTenantTransaction(id, async (client) => {
    const result = await client.query(
      `UPDATE tenants SET nombre = $1, email_contacto = $2, logo_url = $3,
         banner_url = $4, foundation_date = $5, description = $6, slogan = $7,
         telefono = $8, email = $9, facebook_url = $10, instagram_url = $11,
         twitter_url = $12, youtube_url = $13, tiktok_url = $14,
         primary_color = $15, secondary_color = $16,
         slug = COALESCE($17, slug), login_enabled = COALESCE($18, login_enabled)
       WHERE id = $19 RETURNING *`,
      [
        nombre, email_contacto, logo_url, banner_url, foundation_date, description,
        slogan, telefono, email, facebook_url, instagram_url, twitter_url,
        youtube_url, tiktok_url, primary_color, secondary_color,
        slug ? normalizeSlug(slug) : null, login_enabled, id,
      ]
    );
    if (result.rowCount === 0) throw new Error('Escuela no encontrada');

    if (responsable_nombre) {
      await client.query(
        `UPDATE users SET nombre = $1 WHERE tenant_id = $2 AND rol = 'admin'`,
        [responsable_nombre, id]
      );
    }
    return result.rows[0];
  });
};

export const deleteTenant = async (id: string) => {
  const result = await pool.query('DELETE FROM tenants WHERE id = $1', [id]);
  if (result.rowCount === 0) throw new Error('Escuela no encontrada');
};

export const getTenantDetail = async (tenantId: string) => {
  return withTenantTransaction(tenantId, async (client) => {
    const teamsRes = await client.query('SELECT id, nombre FROM teams WHERE tenant_id = $1', [tenantId]);
    const playersRes = await client.query('SELECT COUNT(*) FROM players WHERE tenant_id = $1', [tenantId]);
    const coachesRes = await client.query('SELECT COUNT(*) FROM coaches WHERE tenant_id = $1', [tenantId]);
    const responsableRes = await client.query(
      `SELECT nombre FROM users WHERE tenant_id = $1 AND rol = 'admin' LIMIT 1`,
      [tenantId]
    );
    return {
      equipos: teamsRes.rows,
      cantidad_jugadores: Number(playersRes.rows[0].count),
      cantidad_entrenadores: Number(coachesRes.rows[0].count),
      responsable_nombre: responsableRes.rows[0]?.nombre || '',
    };
  });
}; 

export const getTenantAdmins = async (tenantId: string) =>
  withTenantTransaction(tenantId, async (client) => {
    const result = await client.query(
      `SELECT id, nombre, email, is_active, created_at
       FROM users
       WHERE tenant_id = $1 AND rol = 'admin'
       ORDER BY created_at DESC`,
      [tenantId]
    );
    return result.rows;
  });

export const createTenantAdmin = async (
  tenantId: string,
  data: { nombre: string; email: string; password: string }
) => {
  const { nombre, email, password } = data;
  if (!nombre || !email || !password) {
    throw new Error('Nombre, email y contraseña son requeridos');
  }
  if (password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }
  const passwordHash = await hashPassword(password);
  return withTenantTransaction(tenantId, async (client) => {
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenantId]
    );
    if (existingUser.rowCount) {
      throw new Error('Ya existe un usuario con este email en esta escuela');
    }
    const result = await client.query(
      `INSERT INTO users (id, tenant_id, nombre, email, password_hash, rol, is_active)
       VALUES ($1, $2, $3, $4, $5, 'admin', TRUE)
       RETURNING id, nombre, email, is_active, created_at`,
      [uuidv4(), tenantId, nombre, email, passwordHash]
    );
    return result.rows[0];
  });
};

export const updateTenantAdmin = async (
  tenantId: string,
  adminId: string,
  data: { nombre?: string; email?: string; password?: string; is_active?: boolean }
) =>
  withTenantTransaction(tenantId, async (client) => {
    const adminCheck = await client.query(
      'SELECT id FROM users WHERE id = $1 AND tenant_id = $2 AND rol = $3',
      [adminId, tenantId, 'admin']
    );
    if (!adminCheck.rowCount) throw new Error('Administrador no encontrado');

    const setClause: string[] = [];
    const values: Array<string | boolean> = [];
    if (data.nombre !== undefined) {
      values.push(data.nombre);
      setClause.push(`nombre = $${values.length}`);
    }
    if (data.email !== undefined) {
      const emailCheck = await client.query(
        'SELECT id FROM users WHERE email = $1 AND tenant_id = $2 AND id != $3',
        [data.email, tenantId, adminId]
      );
      if (emailCheck.rowCount) {
        throw new Error('Este email ya está en uso por otro usuario');
      }
      values.push(data.email);
      setClause.push(`email = $${values.length}`);
    }
    if (data.password !== undefined) {
      if (data.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }
      values.push(await hashPassword(data.password));
      setClause.push(`password_hash = $${values.length}`);
    }
    if (data.is_active !== undefined) {
      values.push(data.is_active);
      setClause.push(`is_active = $${values.length}`);
    }
    if (!setClause.length) throw new Error('No hay datos para actualizar');

    values.push(adminId, tenantId);
    const result = await client.query(
      `UPDATE users
       SET ${setClause.join(', ')}
       WHERE id = $${values.length - 1}
         AND tenant_id = $${values.length}
         AND rol = 'admin'
       RETURNING id, nombre, email, is_active, created_at`,
      values
    );
    if (!result.rowCount) throw new Error('Error al actualizar administrador');
    return result.rows[0];
  });

export const deleteTenantAdmin = async (tenantId: string, adminId: string) =>
  withTenantTransaction(tenantId, async (client) => {
    const adminCheck = await client.query(
      'SELECT id FROM users WHERE id = $1 AND tenant_id = $2 AND rol = $3',
      [adminId, tenantId, 'admin']
    );
    if (!adminCheck.rowCount) throw new Error('Administrador no encontrado');

    const adminCount = await client.query(
      'SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND rol = $2 AND is_active = TRUE',
      [tenantId, 'admin']
    );
    if (Number(adminCount.rows[0].count) <= 1) {
      throw new Error('No se puede eliminar el último administrador activo de la escuela');
    }
    await client.query(
      'DELETE FROM users WHERE id = $1 AND tenant_id = $2 AND rol = $3',
      [adminId, tenantId, 'admin']
    );
    return { message: 'Administrador eliminado correctamente' };
  });