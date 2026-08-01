import { Router } from 'express';
import * as statsController from '../controllers/statsController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';
import { requireCoachAccess } from '../middlewares/coachAccessMiddleware';

const router = Router();

router.use(requireAuth, setTenant);
router.use(requireRole('admin', 'coach'));

router.get('/', statsController.getStats);
router.post('/', requireCoachAccess('match', (req) => req.body.match_id), statsController.createStats);
router.put('/:id', requireCoachAccess('stats', (req) => req.params.id), statsController.updateStats);
router.delete('/:id', requireCoachAccess('stats', (req) => req.params.id), statsController.deleteStats);

export default router; 