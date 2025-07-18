import { Router } from 'express';
import * as brandingController from '../controllers/brandingController';
import { requireAdminAuth } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();

router.use(requireAdminAuth, setTenant);

router.post('/logo', brandingController.uploadLogo);
router.post('/banner', brandingController.uploadBanner);
router.put('/colors', brandingController.updateColors);

export default router; 