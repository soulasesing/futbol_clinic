import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as physicalTestService from '../services/physicalTestService';

export const createPhysicalTest = async (req: AuthRequest, res: Response) => {
  try {
    const test = await physicalTestService.createPhysicalTest(
      req.user!.tenantId!,
      req.body
    );
    res.status(201).json(test);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPlayerPhysicalTests = async (req: AuthRequest, res: Response) => {
  try {
    const { playerId } = req.params;
    const tests = await physicalTestService.getPlayerPhysicalTests(
      req.user!.tenantId!,
      playerId
    );
    res.json(tests);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPhysicalTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const test = await physicalTestService.getPhysicalTest(req.user!.tenantId!, id);
    
    if (!test) {
      return res.status(404).json({ message: 'Prueba física no encontrada' });
    }

    res.json(test);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePhysicalTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const test = await physicalTestService.updatePhysicalTest(
      req.user!.tenantId!,
      id,
      req.body
    );

    if (!test) {
      return res.status(404).json({ message: 'Prueba física no encontrada' });
    }

    res.json(test);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePhysicalTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await physicalTestService.deletePhysicalTest(req.user!.tenantId!, id);

    if (!deleted) {
      return res.status(404).json({ message: 'Prueba física no encontrada' });
    }

    res.json({ message: 'Prueba física eliminada correctamente' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 