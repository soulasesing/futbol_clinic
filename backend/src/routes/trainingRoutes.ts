import express from 'express';
import * as trainingController from '../controllers/trainingController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(requireAuth);

// Rutas CRUD básicas
router.get('/', trainingController.getTrainings);
router.post('/', trainingController.createTraining);
router.put('/:id', trainingController.updateTraining);
router.delete('/:id', trainingController.deleteTraining);

export default router; 