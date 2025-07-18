import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { requireAuth } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();

router.use(requireAuth, setTenant);

router.get('/summary', dashboardController.getSummary);

export default router; 