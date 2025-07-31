import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as trainingService from '../services/trainingService';

export const getTrainings = async (req: AuthRequest, res: Response) => {
  try {
    const trainings = await trainingService.getTrainings(req.user?.tenantId!);
    res.json(trainings);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al obtener entrenamientos' });
  }
};

export const createTraining = async (req: AuthRequest, res: Response) => {
  try {
    const training = await trainingService.createTraining(req.user?.tenantId!, req.body);
    res.json(training);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al crear entrenamiento' });
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
      }
    );
    res.json(training);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al actualizar entrenamiento' });
  }
};

export const deleteTraining = async (req: AuthRequest, res: Response) => {
  try {
    const result = await trainingService.deleteTraining(
      req.user?.tenantId!,
      req.params.id,
      req.query.deleteAll === 'true'
    );
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al eliminar entrenamiento' });
  }
}; 