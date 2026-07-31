import { Response } from 'express';
import * as brandingService from '../services/brandingService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getBranding = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      res.status(400).json({ message: 'Escuela requerida' });
      return;
    }
    res.json(await brandingService.getBranding(tenantId));
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateBranding = async (req: AuthRequest, res: Response) => {
  try {
    const {
      nombre, logo_url, banner_url, primary_color, secondary_color,
      description, slogan, telefono, email, facebook_url, instagram_url, twitter_url, youtube_url, tiktok_url, foundation_date
    } = req.body;
    const tenantId = req.user?.tenantId;
    const result = await brandingService.updateBranding(tenantId!, {
      nombre, logo_url, banner_url, primary_color, secondary_color,
      description, slogan, telefono, email, facebook_url, instagram_url, twitter_url, youtube_url, tiktok_url, foundation_date
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 