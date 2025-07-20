import { Router } from 'express';
import * as tenantController from '../controllers/tenantController';

const router = Router();

router.get('/', tenantController.listTenants);

export default router; 