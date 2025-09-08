import { Router } from 'express';
import * as matchController from '../controllers/matchController';
import { requireAuth } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();

router.use(requireAuth, setTenant);

// Match CRUD operations
router.get('/', matchController.getMatches);
router.post('/', matchController.createMatch);
router.get('/upcoming', matchController.getUpcomingMatches);
router.get('/:id', matchController.getMatchById);
router.put('/:id', matchController.updateMatch);
router.delete('/:id', matchController.deleteMatch);

// Match with convocations
router.get('/:id/full', matchController.getMatchWithConvocations);
router.get('/:id/convocations', matchController.getMatchConvocations);
router.get('/:id/lineup', matchController.getStartingLineup);

// Team-related endpoints
router.get('/team/:teamId', matchController.getMatchesByTeam);
router.get('/team/:teamId/players', matchController.getTeamPlayers);

// Convocation management
router.post('/:matchId/convocations', matchController.addPlayersToMatch);
router.delete('/:matchId/convocations/:playerId', matchController.removePlayerFromMatch);

// Convocation status management
router.put('/convocations/:convocationId', matchController.updateConvocationStatus);
router.post('/convocations/:convocationId/confirm', matchController.confirmPlayerAttendance);
router.post('/convocations/:convocationId/absent', matchController.markPlayerAbsent);
router.put('/convocations/:convocationId/stats', matchController.updateMatchStats);

// Player history and stats
router.get('/player/:playerId/history', matchController.getPlayerMatchHistory);
router.get('/player/:playerId/stats', matchController.getPlayerConvocationStats);

export default router; 