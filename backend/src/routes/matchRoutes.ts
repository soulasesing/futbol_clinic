import { Router } from 'express';
import * as matchController from '../controllers/matchController';
import { requireRole, requireTenantAuth } from '../middlewares/authMiddleware';
import { requireCoachAccess } from '../middlewares/coachAccessMiddleware';

const router = Router();

router.use(requireTenantAuth);
router.use(requireRole('admin', 'coach'));

router.get('/', matchController.getMatches);
router.post(
  '/',
  requireCoachAccess('team', (req) => req.body.equipo_local_id),
  matchController.createMatch
);
router.get('/upcoming', matchController.getUpcomingMatches);

router.get('/team/:teamId', requireCoachAccess('team', (req) => req.params.teamId), matchController.getMatchesByTeam);
router.get('/team/:teamId/players', requireCoachAccess('team', (req) => req.params.teamId), matchController.getTeamPlayers);
router.get('/player/:playerId/history', requireCoachAccess('player', (req) => req.params.playerId), matchController.getPlayerMatchHistory);
router.get('/player/:playerId/stats', requireCoachAccess('player', (req) => req.params.playerId), matchController.getPlayerConvocationStats);

router.get('/:id/full', requireCoachAccess('match', (req) => req.params.id), matchController.getMatchWithConvocations);
router.get('/:matchId/convocations', requireCoachAccess('match', (req) => req.params.matchId), matchController.getMatchConvocations);
router.get('/:matchId/lineup', requireCoachAccess('match', (req) => req.params.matchId), matchController.getStartingLineup);
router.post('/:matchId/convocations', requireCoachAccess('match', (req) => req.params.matchId), matchController.addPlayersToMatch);
router.delete('/:matchId/convocations/:playerId', requireCoachAccess('match', (req) => req.params.matchId), matchController.removePlayerFromMatch);

router.put('/convocations/:convocationId', requireCoachAccess('convocation', (req) => req.params.convocationId), matchController.updateConvocationStatus);
router.post('/convocations/:convocationId/confirm', requireCoachAccess('convocation', (req) => req.params.convocationId), matchController.confirmPlayerAttendance);
router.post('/convocations/:convocationId/absent', requireCoachAccess('convocation', (req) => req.params.convocationId), matchController.markPlayerAbsent);
router.put('/convocations/:convocationId/stats', requireCoachAccess('convocation', (req) => req.params.convocationId), matchController.updateMatchStats);

router.get('/:id', requireCoachAccess('match', (req) => req.params.id), matchController.getMatchById);
router.put('/:id', requireCoachAccess('match', (req) => req.params.id), matchController.updateMatch);
router.delete('/:id', requireCoachAccess('match', (req) => req.params.id), matchController.deleteMatch);

export default router; 