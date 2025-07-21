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
    logo_url, banner_url, primary_color, secondary_color,
    description, slogan, telefono, email, facebook_url, instagram_url, twitter_url, youtube_url, tiktok_url, foundation_date
  } = data;
  await pool.query(
    `UPDATE tenants SET
      logo_url = COALESCE($1, logo_url),
      banner_url = COALESCE($2, banner_url),
      primary_color = COALESCE($3, primary_color),
      secondary_color = COALESCE($4, secondary_color),
      description = COALESCE($5, description),
      slogan = COALESCE($6, slogan),
      telefono = COALESCE($7, telefono),
      email = COALESCE($8, email),
      facebook_url = COALESCE($9, facebook_url),
      instagram_url = COALESCE($10, instagram_url),
      twitter_url = COALESCE($11, twitter_url),
      youtube_url = COALESCE($12, youtube_url),
      tiktok_url = COALESCE($13, tiktok_url),
      foundation_date = COALESCE($14, foundation_date)
     WHERE id = $15`,
    [logo_url, banner_url, primary_color, secondary_color, description, slogan, telefono, email, facebook_url, instagram_url, twitter_url, youtube_url, tiktok_url, foundation_date, tenantId]
  );
  return {
    logo_url, banner_url, primary_color, secondary_color,
    description, slogan, telefono, email, facebook_url, instagram_url, twitter_url, youtube_url, tiktok_url, foundation_date
  };
}; 