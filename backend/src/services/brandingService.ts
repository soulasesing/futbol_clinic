import { withTenantTransaction } from '../utils/db';

export const getBranding = async (tenantId: string) =>
  withTenantTransaction(tenantId, async (client) => {
    const result = await client.query(
      `SELECT id, slug, nombre, logo_url, banner_url, primary_color, secondary_color,
              description, slogan, telefono, email, facebook_url, instagram_url,
              twitter_url, youtube_url, tiktok_url, foundation_date
       FROM tenants
       WHERE id = $1`,
      [tenantId]
    );
    if (!result.rows[0]) throw new Error('Escuela no encontrada');
    return result.rows[0];
  });

export const updateLogo = async (tenantId: string, logoUrl: string) => withTenantTransaction(tenantId, async (client) => {
  await client.query('UPDATE tenants SET logo_url = $1 WHERE id = $2', [logoUrl, tenantId]);
  return { logo_url: logoUrl };
});

export const updateBanner = async (tenantId: string, bannerUrl: string) => withTenantTransaction(tenantId, async (client) => {
  await client.query('UPDATE tenants SET banner_url = $1 WHERE id = $2', [bannerUrl, tenantId]);
  return { banner_url: bannerUrl };
});

export const updateColors = async (tenantId: string, primary: string, secondary: string) => withTenantTransaction(tenantId, async (client) => {
  // Puedes agregar columnas en tenants para los colores si lo deseas
  await client.query('UPDATE tenants SET primary_color = $1, secondary_color = $2 WHERE id = $3', [primary, secondary, tenantId]);
  return { primary_color: primary, secondary_color: secondary };
});

export const updateBranding = async (tenantId: string, data: any) => withTenantTransaction(tenantId, async (client) => {
  const {
    nombre, logo_url, banner_url, primary_color, secondary_color,
    description, slogan, telefono, email, facebook_url, instagram_url, twitter_url, youtube_url, tiktok_url, foundation_date
  } = data;
  await client.query(
    `UPDATE tenants SET
      nombre = $1,
      logo_url = $2,
      banner_url = $3,
      primary_color = $4,
      secondary_color = $5,
      description = $6,
      slogan = $7,
      telefono = COALESCE($8, telefono),
      email = COALESCE($9, email),
      facebook_url = COALESCE($10, facebook_url),
      instagram_url = COALESCE($11, instagram_url),
      twitter_url = COALESCE($12, twitter_url),
      youtube_url = COALESCE($13, youtube_url),
      tiktok_url = COALESCE($14, tiktok_url),
      foundation_date = COALESCE($15, foundation_date)
     WHERE id = $16`,
    [nombre, logo_url, banner_url, primary_color, secondary_color, description, slogan, telefono, email, facebook_url, instagram_url, twitter_url, youtube_url, tiktok_url, foundation_date, tenantId]
  );
  return {
    nombre, logo_url, banner_url, primary_color, secondary_color,
    description, slogan, telefono, email, facebook_url, instagram_url, twitter_url, youtube_url, tiktok_url, foundation_date
  };
});