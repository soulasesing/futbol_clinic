import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import { requireAuth } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();

router.use(requireAuth, setTenant);

router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory);
router.post('/default', categoryController.insertDefaultCategories);
router.get('/:id', categoryController.getCategoryById);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router; 