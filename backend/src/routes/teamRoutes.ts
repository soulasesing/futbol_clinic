import { Router } from 'express';
import * as teamController from '../controllers/teamController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();

router.use(requireAuth, setTenant);

router.get('/', requireRole('admin', 'coach'), teamController.getTeams);
router.get('/with-players', requireRole('admin', 'coach'), teamController.getTeamsWithPlayersAndCoach);
router.post('/', requireRole('admin'), teamController.createTeam);
router.put('/:id', requireRole('admin'), teamController.updateTeam);
router.delete('/:id', requireRole('admin'), teamController.deleteTeam);

export default router; 