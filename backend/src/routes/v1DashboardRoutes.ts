import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { requireTenantAuth } from '../middlewares/authMiddleware';

const router = Router();

router.use(requireTenantAuth);
router.get('/admin', dashboardController.getAdminDashboard);
router.get('/coach', dashboardController.getCoachDashboard);

export default router;
