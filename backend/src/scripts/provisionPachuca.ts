import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { pool, setLocalTenantContext } from '../utils/db';
import { hashPassword } from '../utils/hash';

dotenv.config();

const provision = async (): Promise<void> => {
  const email = process.env.PACHUCA_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.PACHUCA_ADMIN_PASSWORD;
  const parentEmail = process.env.PACHUCA_PARENT_EMAIL?.trim().toLowerCase();
  const parentPassword = process.env.PACHUCA_PARENT_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error('Set PACHUCA_ADMIN_EMAIL and PACHUCA_ADMIN_PASSWORD (minimum 12 characters)');
  }
  if (parentEmail && (!parentPassword || parentPassword.length < 12)) {
    throw new Error('PACHUCA_PARENT_PASSWORD must contain at least 12 characters');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query(
      `SELECT id FROM tenants WHERE slug = 'pachuca-futbol-club' FOR UPDATE`
    );
    const tenantId = existing.rows[0]?.id ?? uuidv4();

    if (existing.rows[0]) {
      await client.query(
        `UPDATE tenants
         SET nombre = 'Academia Internacional de Fútbol PACHUCA',
             email_contacto = $1,
             logo_url = '/brands/pachuca/logo.svg',
             primary_color = '#162577',
             secondary_color = '#FFFFFF',
             description = 'Academia Internacional de Fútbol PACHUCA',
             slogan = 'Formación, identidad y excelencia',
             login_enabled = TRUE
         WHERE id = $2`,
        [email, tenantId]
      );
    } else {
      await client.query(
        `INSERT INTO tenants
          (id, nombre, email_contacto, logo_url, primary_color, secondary_color,
           description, slogan, slug, login_enabled)
         VALUES
          ($1, 'Academia Internacional de Fútbol PACHUCA', $2, '/brands/pachuca/logo.svg', '#162577',
           '#FFFFFF', 'Academia Internacional de Fútbol PACHUCA',
           'Formación, identidad y excelencia', 'pachuca-futbol-club', TRUE)`,
        [tenantId, email]
      );
    }

    await setLocalTenantContext(client, tenantId);
    const passwordHash = await hashPassword(password);
    const admin = await client.query(
      `SELECT id FROM users
       WHERE tenant_id = $1 AND LOWER(email) = $2 AND rol = 'admin'
       FOR UPDATE`,
      [tenantId, email]
    );
    if (admin.rows[0]) {
      await client.query(
        `UPDATE users SET nombre = 'Administrador Pachuca', password_hash = $1,
          is_active = TRUE
         WHERE id = $2 AND tenant_id = $3`,
        [passwordHash, admin.rows[0].id, tenantId]
      );
    } else {
      await client.query(
        `INSERT INTO users
          (id, tenant_id, nombre, email, password_hash, rol, is_active)
         VALUES ($1, $2, 'Administrador Pachuca', $3, $4, 'admin', TRUE)`,
        [uuidv4(), tenantId, email, passwordHash]
      );
    }

    if (parentEmail && parentPassword) {
      const parentPasswordHash = await hashPassword(parentPassword);
      const parent = await client.query(
        `SELECT id FROM users
         WHERE tenant_id = $1 AND LOWER(email) = $2 AND rol = 'parent'
         FOR UPDATE`,
        [tenantId, parentEmail]
      );
      if (parent.rows[0]) {
        await client.query(
          `UPDATE users SET nombre = 'Familia Pachuca', password_hash = $1,
            is_active = TRUE
           WHERE id = $2 AND tenant_id = $3`,
          [parentPasswordHash, parent.rows[0].id, tenantId]
        );
      } else {
        await client.query(
          `INSERT INTO users
            (id, tenant_id, nombre, email, password_hash, rol, is_active)
           VALUES ($1, $2, 'Familia Pachuca', $3, $4, 'parent', TRUE)`,
          [uuidv4(), tenantId, parentEmail, parentPasswordHash]
        );
      }
    }
    await client.query('COMMIT');
    process.stdout.write(`Pachuca tenant ready: /escuela/pachuca-futbol-club/login (${email})\n`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

provision()
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
