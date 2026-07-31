import { Response } from 'express';
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

export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin role required' });
    }
    const data = await dashboardService.getAdminDashboard(req.user.tenantId!);
    return res.json(data);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const getCoachDashboard = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'coach') {
      return res.status(403).json({ message: 'Coach role required' });
    }
    const data = await dashboardService.getCoachDashboard(
      req.user.tenantId!,
      req.user.userId
    );
    return res.json(data);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};