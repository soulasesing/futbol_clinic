import { Router } from 'express';
import * as tenantController from '../controllers/tenantController';
import { requireAuth, requireSuperAdminAuth } from '../middlewares/authMiddleware';

const router = Router();

// Public route - anyone can list tenants (for login page)
router.get('/', tenantController.listTenants);

// Super admin only routes for tenant management
router.post('/', requireAuth, requireSuperAdminAuth, tenantController.createTenantWithAdmin);
router.put('/:id', requireAuth, requireSuperAdminAuth, tenantController.updateTenant);
router.delete('/:id', requireAuth, requireSuperAdminAuth, tenantController.deleteTenant);
router.get('/:id/detail', requireAuth, requireSuperAdminAuth, tenantController.getTenantDetail);

// Admin user management routes (super admin only)
router.get('/:id/admins', requireAuth, requireSuperAdminAuth, tenantController.getTenantAdmins);
router.post('/:id/admins', requireAuth, requireSuperAdminAuth, tenantController.createTenantAdmin);
router.put('/:id/admins/:adminId', requireAuth, requireSuperAdminAuth, tenantController.updateTenantAdmin);
router.delete('/:id/admins/:adminId', requireAuth, requireSuperAdminAuth, tenantController.deleteTenantAdmin);

export default router; 