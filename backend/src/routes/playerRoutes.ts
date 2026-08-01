import { Router } from 'express';
import * as playerController from '../controllers/playerController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();

router.use(requireAuth, setTenant);

router.get('/', requireRole('admin', 'coach'), playerController.getPlayers);
router.post('/', requireRole('admin'), playerController.createPlayer);
router.get('/birthdays', requireRole('admin', 'coach'), playerController.getBirthdays);
router.get('/:id/teams', requireRole('admin', 'coach'), playerController.getPlayerTeams);
router.get('/:id/export', requireRole('admin'), playerController.exportPlayerData);
router.delete('/:id/personal-data', requireRole('admin'), playerController.erasePlayerData);
router.get('/:id', requireRole('admin', 'coach'), playerController.getPlayerById);
router.put('/:id', requireRole('admin'), playerController.updatePlayer);
router.delete('/:id', requireRole('admin'), playerController.deletePlayer);

export default router; 