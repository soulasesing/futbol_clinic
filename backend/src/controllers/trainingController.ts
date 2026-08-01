import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as trainingService from '../services/trainingService';

export const getTrainings = async (req: AuthRequest, res: Response) => {
  try {
    const trainings = await trainingService.getTrainings(
      req.user?.tenantId!,
      req.user?.role === 'coach' ? req.user.userId : undefined
    );
    res.json(trainings);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener entrenamientos' });
  }
};

export const createTraining = async (req: AuthRequest, res: Response) => {
  try {
    const training = await trainingService.createTraining(
      req.user?.tenantId!,
      req.body,
      req.user?.role === 'coach' ? req.user.userId : undefined
    );
    res.json(training);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear entrenamiento';
    res.status(message.includes('acceso') ? 403 : 500).json({ message });
  }
};

export const updateTraining = async (req: AuthRequest, res: Response) => {
  try {
    const training = await trainingService.updateTraining(
      req.user?.tenantId!,
      req.params.id,
      {
        ...req.body,
        updateAll: req.query.updateAll === 'true'
      },
      req.user?.role === 'coach' ? req.user.userId : undefined
    );
    res.json(training);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al actualizar entrenamiento';
    res.status(message.includes('acceso') ? 403 : 500).json({ message });
  }
};

export const deleteTraining = async (req: AuthRequest, res: Response) => {
  try {
    const result = await trainingService.deleteTraining(
      req.user?.tenantId!,
      req.params.id,
      req.query.deleteAll === 'true',
      req.user?.role === 'coach' ? req.user.userId : undefined
    );
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al eliminar entrenamiento';
    res.status(message.includes('acceso') ? 403 : 500).json({ message });
  }
}; 