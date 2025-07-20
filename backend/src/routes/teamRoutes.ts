import { Router } from 'express';
import * as teamController from '../controllers/teamController';
import { requireAuth } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();

router.use(requireAuth, setTenant);

router.get('/', teamController.getTeams);
router.get('/with-players', teamController.getTeamsWithPlayersAndCoach);
router.post('/', teamController.createTeam);
router.put('/:id', teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

export default router; 