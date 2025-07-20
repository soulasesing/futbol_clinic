import { Router } from 'express';
import * as tenantController from '../controllers/tenantController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', tenantController.listTenants);
router.post('/', requireAuth, tenantController.createTenantWithAdmin);
router.put('/:id', requireAuth, tenantController.updateTenant);
router.delete('/:id', requireAuth, tenantController.deleteTenant);
router.get('/:id/detail', requireAuth, tenantController.getTenantDetail);

export default router; 