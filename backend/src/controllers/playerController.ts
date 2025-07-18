import { Request, Response } from 'express';
import * as playerService from '../services/playerService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getPlayers = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const players = await playerService.getPlayers(tenantId!);
    res.json(players);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createPlayer = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const player = await playerService.createPlayer(tenantId!, req.body);
    res.status(201).json(player);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePlayer = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const player = await playerService.updatePlayer(tenantId!, req.params.id, req.body);
    res.json(player);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePlayer = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    await playerService.deletePlayer(tenantId!, req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 