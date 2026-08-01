import { Router } from 'express';
import * as controller from '../controllers/landingController';
import { requireAdminAuth } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();

router.get('/public/:slug', controller.getPublicLanding);

router.use(requireAdminAuth, setTenant);
router.get('/', controller.getAdminLanding);
router.put('/settings', controller.updateSettings);
router.post('/posts', controller.createPost);
router.put('/posts/:id', controller.updatePost);
router.delete('/posts/:id', controller.deletePost);
router.post('/pricing', controller.createPricing);
router.put('/pricing/:id', controller.updatePricing);
router.delete('/pricing/:id', controller.deletePricing);

export default router;
