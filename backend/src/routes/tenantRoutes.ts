import { Router } from 'express';
import * as tenantController from '../controllers/tenantController';
import { requireSuperAdminAuth } from '../middlewares/authMiddleware';

const router = Router();

router.get('/public', tenantController.listPublicTenants);
router.get('/public/:slug', tenantController.getPublicTenantBySlug);

router.use(requireSuperAdminAuth);
router.get('/', tenantController.listTenants);
router.post('/', tenantController.createTenantWithAdmin);
router.get('/:id/detail', tenantController.getTenantDetail);
router.patch('/:id/status', tenantController.setTenantStatus);
router.put('/:id', tenantController.updateTenant);
router.delete('/:id', tenantController.deleteTenant);
router.get('/:id/admins', tenantController.getTenantAdmins);
router.post('/:id/admins', tenantController.createTenantAdmin);
router.put('/:id/admins/:adminId', tenantController.updateTenantAdmin);
router.delete('/:id/admins/:adminId', tenantController.deleteTenantAdmin);

export default router; 