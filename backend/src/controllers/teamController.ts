import { Request, Response } from 'express';
import * as teamService from '../services/teamService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getTeams = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const teams = await teamService.getTeams(tenantId!);
    res.json(teams);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createTeam = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const team = await teamService.createTeam(tenantId!, req.body);
    res.status(201).json(team);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateTeam = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const team = await teamService.updateTeam(tenantId!, req.params.id, req.body);
    res.json(team);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTeam = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    await teamService.deleteTeam(tenantId!, req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 