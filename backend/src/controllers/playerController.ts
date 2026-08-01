import { Request, Response } from 'express';
import { del } from '@vercel/blob';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import * as playerService from '../services/playerService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getPlayers = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const players = await playerService.getPlayers(
      tenantId!,
      req.user?.role === 'coach' ? req.user.userId : undefined
    );
    res.json(players);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPlayerTeams = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    const teams = await playerService.getPlayerTeams(
      tenantId!,
      id,
      req.user?.role === 'coach' ? req.user.userId : undefined
    );
    res.json(teams);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createPlayer = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const player = await playerService.createPlayer(
      tenantId!,
      req.body,
      req.user!.userId
    );
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
    const player = await playerService.getPlayerById(
      tenantId!,
      id,
      req.user?.role === 'coach' ? req.user.userId : undefined
    );
    res.json(player);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getBirthdays = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const data = await playerService.getBirthdays(
      tenantId!,
      req.user?.role === 'coach' ? req.user.userId : undefined
    );
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 

export const exportPlayerData = async (req: AuthRequest, res: Response) => {
  try {
    const data = await playerService.exportPlayerData(
      req.user!.tenantId!,
      req.params.id,
      req.user!.userId
    );
    res.setHeader('Content-Disposition', `attachment; filename="player-${req.params.id}.json"`);
    res.json(data);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const erasePlayerData = async (req: AuthRequest, res: Response) => {
  try {
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
    if (reason.length < 5) {
      res.status(400).json({ message: 'Indica el motivo de la eliminación' });
      return;
    }
    const tenantId = req.user!.tenantId!;
    const storageKeys = await playerService.getPlayerDocumentKeys(tenantId, req.params.id);
    const token =
      process.env.PRIVATE_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
    for (const storageKey of storageKeys) {
      if (storageKey.startsWith('local:')) {
        const privateRoot = path.resolve(process.cwd(), 'private_uploads');
        const filePath = path.resolve(privateRoot, storageKey.slice('local:'.length));
        if (filePath.startsWith(`${privateRoot}${path.sep}`)) {
          await unlink(filePath).catch((error: NodeJS.ErrnoException) => {
            if (error.code !== 'ENOENT') throw error;
          });
        }
      } else if (token) {
        await del(storageKey, { token });
      } else {
        throw new Error('Almacenamiento privado no configurado');
      }
    }
    await playerService.erasePlayerData(
      tenantId,
      req.params.id,
      req.user!.userId,
      reason
    );
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};