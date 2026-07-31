import { Router } from 'express';
import * as controller from '../controllers/paymentController';
import { requireAuth } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();

router.use(requireAuth, setTenant);
router.get('/accounts', controller.listAccounts);
router.post('/accounts', controller.saveAccount);
router.put('/accounts/:id', controller.saveAccount);
router.get('/concepts', controller.listFeeConcepts);
router.post('/concepts', controller.createFeeConcept);
router.get('/fee-concepts', controller.listFeeConcepts);
router.post('/fee-concepts', controller.createFeeConcept);
router.get('/charges', controller.listCharges);
router.post('/charges', controller.createCharge);
router.get('/submissions', controller.listSubmissions);
router.post('/submissions/:id/review', controller.reviewSubmission);
router.patch('/submissions/:id', controller.reviewSubmission);
router.get('/submissions/:id/proof', controller.downloadProof);
router.get('/payment-proofs', controller.listSubmissions);
router.patch('/payment-proofs/:id', controller.reviewSubmission);
router.post('/payment-proofs/:id/review', controller.reviewSubmission);
router.get('/payment-proofs/:id/file', controller.downloadProof);
router.post('/payments/:id/refunds', controller.recordRefund);
router.get('/summary', controller.adminSummary);
router.get('/admin/summary', controller.adminSummary);
router.get('/portfolio', controller.portfolio);
router.get('/family', controller.familyFinance);
router.get('/receipts', controller.listReceipts);
router.get('/receipts/:id', controller.getReceipt);

export default router;
