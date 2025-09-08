import { Response } from 'express';
import * as matchService from '../services/matchService';
import * as convocationService from '../services/convocationService';
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

// Controladores para convocatorias

export const getMatchById = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const match = await matchService.getMatchById(tenantId!, req.params.id);
    res.json(match);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const getMatchWithConvocations = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const match = await matchService.getMatchWithConvocations(tenantId!, req.params.id);
    res.json(match);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const getTeamPlayers = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const players = await matchService.getTeamPlayers(tenantId!, req.params.teamId);
    res.json(players);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getUpcomingMatches = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const limit = parseInt(req.query.limit as string) || 5;
    const matches = await matchService.getUpcomingMatches(tenantId!, limit);
    res.json(matches);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMatchesByTeam = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const limit = parseInt(req.query.limit as string) || 10;
    const matches = await matchService.getMatchesByTeam(tenantId!, req.params.teamId, limit);
    res.json(matches);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Convocatorias

export const addPlayersToMatch = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { matchId } = req.params;
    const { convocations } = req.body;
    
    const result = await convocationService.addPlayersToMatch(tenantId!, matchId, convocations);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removePlayerFromMatch = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { matchId, playerId } = req.params;
    
    await convocationService.removePlayerFromMatch(tenantId!, matchId, playerId);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateConvocationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { convocationId } = req.params;
    const updates = req.body;
    
    const result = await convocationService.updateConvocationStatus(tenantId!, convocationId, updates);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMatchConvocations = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { matchId } = req.params;
    
    const convocations = await matchService.getMatchConvocations(tenantId!, matchId);
    res.json(convocations);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPlayerMatchHistory = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { playerId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const history = await convocationService.getPlayerMatchHistory(tenantId!, playerId, limit);
    res.json(history);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPlayerConvocationStats = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { playerId } = req.params;
    
    const stats = await convocationService.getPlayerConvocationStats(tenantId!, playerId);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getStartingLineup = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { matchId } = req.params;
    
    const lineup = await convocationService.getStartingLineupAndSubs(tenantId!, matchId);
    res.json(lineup);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const confirmPlayerAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { convocationId } = req.params;
    
    const result = await convocationService.confirmPlayerAttendance(tenantId!, convocationId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const markPlayerAbsent = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { convocationId } = req.params;
    const { reason } = req.body;
    
    const result = await convocationService.markPlayerAbsent(tenantId!, convocationId, reason);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateMatchStats = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { convocationId } = req.params;
    const stats = req.body;
    
    const result = await convocationService.updateMatchStats(tenantId!, convocationId, stats);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 