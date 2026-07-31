import { Router } from 'express';
import * as brandingController from '../controllers/brandingController';
import { requireAdminAuth, requireAuth } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();

router.get('/', requireAuth, setTenant, brandingController.getBranding);
router.put('/', requireAdminAuth, setTenant, brandingController.updateBranding);

export default router; 