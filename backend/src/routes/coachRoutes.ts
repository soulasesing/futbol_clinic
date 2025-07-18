import { Router } from 'express';
import * as coachController from '../controllers/coachController';
import { requireAuth } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();

router.use(requireAuth, setTenant);

router.get('/', coachController.getCoaches);
router.post('/', coachController.createCoach);
router.put('/:id', coachController.updateCoach);
router.delete('/:id', coachController.deleteCoach);

export default router; 