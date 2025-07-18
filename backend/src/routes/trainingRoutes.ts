import { Router } from 'express';
import * as trainingController from '../controllers/trainingController';
import { requireAuth } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();

router.use(requireAuth, setTenant);

router.get('/', trainingController.getTrainings);
router.post('/', trainingController.createTraining);
router.put('/:id', trainingController.updateTraining);
router.delete('/:id', trainingController.deleteTraining);

export default router; 