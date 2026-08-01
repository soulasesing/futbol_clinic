import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();

router.use(requireAuth, setTenant);

router.get('/', requireRole('admin', 'coach'), categoryController.getCategories);
router.post('/', requireRole('admin'), categoryController.createCategory);
router.post('/default', requireRole('admin'), categoryController.insertDefaultCategories);
router.get('/:id', requireRole('admin', 'coach'), categoryController.getCategoryById);
router.put('/:id', requireRole('admin'), categoryController.updateCategory);
router.delete('/:id', requireRole('admin'), categoryController.deleteCategory);

export default router; 