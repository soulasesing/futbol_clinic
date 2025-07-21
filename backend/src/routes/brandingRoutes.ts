import { Router } from 'express';
import * as brandingController from '../controllers/brandingController';
import { requireAdminAuth } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();

router.use(requireAdminAuth, setTenant);

router.put('/', brandingController.updateBranding);

export default router; 