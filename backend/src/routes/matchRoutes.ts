import { Router } from 'express';
import * as matchController from '../controllers/matchController';
import { requireTenantAuth } from '../middlewares/authMiddleware';

const router = Router();

router.use(requireTenantAuth);

router.get('/', matchController.getMatches);
router.post('/', matchController.createMatch);
router.get('/upcoming', matchController.getUpcomingMatches);

router.get('/team/:teamId', matchController.getMatchesByTeam);
router.get('/team/:teamId/players', matchController.getTeamPlayers);
router.get('/player/:playerId/history', matchController.getPlayerMatchHistory);
router.get('/player/:playerId/stats', matchController.getPlayerConvocationStats);

router.get('/:id/full', matchController.getMatchWithConvocations);
router.get('/:matchId/convocations', matchController.getMatchConvocations);
router.get('/:matchId/lineup', matchController.getStartingLineup);
router.post('/:matchId/convocations', matchController.addPlayersToMatch);
router.delete('/:matchId/convocations/:playerId', matchController.removePlayerFromMatch);

router.put('/convocations/:convocationId', matchController.updateConvocationStatus);
router.post('/convocations/:convocationId/confirm', matchController.confirmPlayerAttendance);
router.post('/convocations/:convocationId/absent', matchController.markPlayerAbsent);
router.put('/convocations/:convocationId/stats', matchController.updateMatchStats);

router.get('/:id', matchController.getMatchById);
router.put('/:id', matchController.updateMatch);
router.delete('/:id', matchController.deleteMatch);

export default router; 