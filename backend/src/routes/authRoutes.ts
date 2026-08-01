import { Router } from 'express';
import * as authController from '../controllers/authController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/tenant-login', authController.tenantLogin);
router.post('/super-admin-login', authController.superAdminLogin);
router.post('/refresh', requireAuth, authController.refreshSession);
router.post('/forgot', authController.forgotPassword);
router.post('/reset', authController.resetPassword);
router.post('/change-password', requireAuth, authController.changePassword);

export default router; 