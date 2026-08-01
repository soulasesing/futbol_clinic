import { Router } from 'express';
import * as controller from '../controllers/domainController';
import { requireAuth } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();

router.use(requireAuth, setTenant);
router.get('/locations', controller.listLocations);
router.post('/locations', controller.createLocation);
router.get('/seasons', controller.listSeasons);
router.post('/seasons', controller.createSeason);
router.get('/households', controller.listHouseholds);
router.post('/households', controller.createHousehold);
router.post('/guardians', controller.createGuardian);
router.post('/guardian-players', controller.linkGuardianPlayer);
router.post('/coach-team-assignments', controller.assignCoachTeam);
router.post('/consents', controller.createConsent);
router.post('/documents', controller.createDocument);
router.get('/audit-events', controller.listAuditEvents);
router.get('/notifications', controller.listNotifications);
router.post('/notifications', controller.createNotification);

export default router;
