import { Request, Response } from 'express';
import * as coachService from '../services/coachService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getCoaches = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const coaches = await coachService.getCoaches(tenantId!);
    res.json(coaches);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createCoach = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const coach = await coachService.createCoach(tenantId!, req.body);
    res.status(201).json(coach);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateCoach = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const coach = await coachService.updateCoach(tenantId!, req.params.id, req.body);
    res.json(coach);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCoach = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    await coachService.deleteCoach(tenantId!, req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 