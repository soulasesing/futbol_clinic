import { Router } from 'express';
import * as controller from '../controllers/parentAccessController';
import { requireAdminAuth } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();

router.get('/invitation/:token', controller.getInvitation);

router.use(requireAdminAuth, setTenant);
router.get('/', controller.listParents);
router.post('/invite', controller.inviteParent);
router.post('/:guardianId/resend', controller.resendInvitation);
router.post('/:guardianId/revoke', controller.revokeInvitation);
router.put('/:guardianId', controller.updateParent);
router.patch('/:guardianId/access', controller.setParentAccess);

export default router;
