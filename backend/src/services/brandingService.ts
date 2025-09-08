import { pool } from '../utils/db';

export const updateLogo = async (tenantId: string, logoUrl: string) => {
  await pool.query('UPDATE tenants SET logo_url = $1 WHERE id = $2', [logoUrl, tenantId]);
  return { logo_url: logoUrl };
};

export const updateBanner = async (tenantId: string, bannerUrl: string) => {
  await pool.query('UPDATE tenants SET banner_url = $1 WHERE id = $2', [bannerUrl, tenantId]);
  return { banner_url: bannerUrl };
};

export const updateColors = async (tenantId: string, primary: string, secondary: string) => {
  // Puedes agregar columnas en tenants para los colores si lo deseas
  await pool.query('UPDATE tenants SET primary_color = $1, secondary_color = $2 WHERE id = $3', [primary, secondary, tenantId]);
  return { primary_color: primary, secondary_color: secondary };
};

export const updateBranding = async (tenantId: string, data: any) => {
  const {
    nombre, logo_url, banner_url, primary_color, secondary_color,
    description, slogan, telefono, email, facebook_url, instagram_url, twitter_url, youtube_url, tiktok_url, foundation_date
  } = data;
  await pool.query(
    `UPDATE tenants SET
      nombre = COALESCE($1, nombre),
      logo_url = COALESCE($2, logo_url),
      banner_url = COALESCE($3, banner_url),
      primary_color = COALESCE($4, primary_color),
      secondary_color = COALESCE($5, secondary_color),
      description = COALESCE($6, description),
      slogan = COALESCE($7, slogan),
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
}; 