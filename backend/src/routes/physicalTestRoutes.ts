import { Router } from 'express';
import * as physicalTestController from '../controllers/physicalTestController';
import { requireRole, requireTenantAuth } from '../middlewares/authMiddleware';

const router = Router();

// Apply middleware
router.use(requireTenantAuth);
router.use(requireRole('admin'));

// Routes
router.post('/', physicalTestController.createPhysicalTest);
router.get('/player/:playerId', physicalTestController.getPlayerPhysicalTests);
router.get('/:id', physicalTestController.getPhysicalTest);
router.put('/:id', physicalTestController.updatePhysicalTest);
router.delete('/:id', physicalTestController.deletePhysicalTest);

export default router; 