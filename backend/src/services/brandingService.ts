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