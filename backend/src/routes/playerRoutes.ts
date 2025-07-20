import { Router } from 'express';
import * as playerController from '../controllers/playerController';
import { requireAuth } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();

router.use(requireAuth, setTenant);

router.get('/', playerController.getPlayers);
router.post('/', playerController.createPlayer);
router.get('/:id/teams', playerController.getPlayerTeams);
router.get('/:id', playerController.getPlayerById);
router.put('/:id', playerController.updatePlayer);
router.delete('/:id', playerController.deletePlayer);

export default router; 