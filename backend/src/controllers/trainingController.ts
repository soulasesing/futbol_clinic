import { Request, Response } from 'express';
import * as trainingService from '../services/trainingService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getTrainings = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const trainings = await trainingService.getTrainings(tenantId!);
    res.json(trainings);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createTraining = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const training = await trainingService.createTraining(tenantId!, req.body);
    res.status(201).json(training);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateTraining = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const training = await trainingService.updateTraining(tenantId!, req.params.id, req.body);
    res.json(training);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTraining = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    await trainingService.deleteTraining(tenantId!, req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 