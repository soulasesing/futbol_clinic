import { Router } from 'express';
import * as invitationController from '../controllers/invitationController';
import { requireAdminAuth } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', requireAdminAuth, invitationController.invite);

export default router; 