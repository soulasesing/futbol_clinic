import { Router } from 'express';
import * as attendanceController from '../controllers/attendanceController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';
import { requireCoachAccess } from '../middlewares/coachAccessMiddleware';

const router = Router();

router.use(requireAuth, setTenant);
router.use(requireRole('admin', 'coach'));

router.get('/', attendanceController.getAttendance);
router.post('/', requireCoachAccess('training', (req) => req.body.training_id), attendanceController.createAttendance);
router.put('/:id', requireCoachAccess('attendance', (req) => req.params.id), attendanceController.updateAttendance);
router.delete('/:id', requireCoachAccess('attendance', (req) => req.params.id), attendanceController.deleteAttendance);

export default router; 