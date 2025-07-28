import { Router } from 'express';
import * as physicalTestController from '../controllers/physicalTestController';
import { requireAuth } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();

// Apply middleware
router.use(requireAuth);
router.use(setTenant);

// Routes
router.post('/', physicalTestController.createPhysicalTest);
router.get('/player/:playerId', physicalTestController.getPlayerPhysicalTests);
router.get('/:id', physicalTestController.getPhysicalTest);
router.put('/:id', physicalTestController.updatePhysicalTest);
router.delete('/:id', physicalTestController.deletePhysicalTest);

export default router; 