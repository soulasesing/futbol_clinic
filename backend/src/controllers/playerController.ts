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

export const getPlayerTeams = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    const teams = await playerService.getPlayerTeams(tenantId!, id);
    res.json(teams);
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
    const { id } = req.params;
    const player = await playerService.updatePlayer(tenantId!, id, req.body);
    res.json(player);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePlayer = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    await playerService.deletePlayer(tenantId!, id);
    res.json({ message: 'Jugador eliminado' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPlayerById = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    const player = await playerService.getPlayerById(tenantId!, id);
    res.json(player);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 