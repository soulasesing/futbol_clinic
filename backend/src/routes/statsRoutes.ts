import { Router } from 'express';
import * as statsController from '../controllers/statsController';
import { requireAuth } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();

router.use(requireAuth, setTenant);

router.get('/', statsController.getStats);
router.post('/', statsController.createStats);
router.put('/:id', statsController.updateStats);
router.delete('/:id', statsController.deleteStats);

export default router; 