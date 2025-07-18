import { Request, Response } from 'express';
import * as brandingService from '../services/brandingService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const uploadLogo = async (req: AuthRequest, res: Response) => {
  try {
    // Aquí deberías manejar el archivo (req.file), por ahora solo URL
    const { logo_url } = req.body;
    const tenantId = req.user?.tenantId;
    const result = await brandingService.updateLogo(tenantId!, logo_url);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadBanner = async (req: AuthRequest, res: Response) => {
  try {
    const { banner_url } = req.body;
    const tenantId = req.user?.tenantId;
    const result = await brandingService.updateBanner(tenantId!, banner_url);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateColors = async (req: AuthRequest, res: Response) => {
  try {
    const { primary_color, secondary_color } = req.body;
    const tenantId = req.user?.tenantId;
    const result = await brandingService.updateColors(tenantId!, primary_color, secondary_color);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 