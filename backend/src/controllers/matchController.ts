import { Request, Response } from 'express';
import * as matchService from '../services/matchService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getMatches = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const matches = await matchService.getMatches(tenantId!);
    res.json(matches);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createMatch = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const match = await matchService.createMatch(tenantId!, req.body);
    res.status(201).json(match);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateMatch = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const match = await matchService.updateMatch(tenantId!, req.params.id, req.body);
    res.json(match);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteMatch = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    await matchService.deleteMatch(tenantId!, req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 