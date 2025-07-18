import { Request, Response } from 'express';
import * as statsService from '../services/statsService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const stats = await statsService.getStats(tenantId!);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createStats = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const stat = await statsService.createStats(tenantId!, req.body);
    res.status(201).json(stat);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateStats = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const stat = await statsService.updateStats(tenantId!, req.params.id, req.body);
    res.json(stat);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteStats = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    await statsService.deleteStats(tenantId!, req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 