import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboardService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getSummary = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const summary = await dashboardService.getSummary(tenantId!);
    res.json(summary);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 