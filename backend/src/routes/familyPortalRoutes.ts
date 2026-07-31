import { NextFunction, Response, Router } from 'express';
import multer from 'multer';
import * as controller from '../controllers/familyPortalController';
import { AuthRequest, requireAuth } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 10,
  },
  fileFilter: (_req, file, callback) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      callback(new Error('Tipo de archivo no permitido'));
      return;
    }
    callback(null, true);
  },
});

router.use(requireAuth, setTenant);
router.get('/portal', controller.getPortal);
router.patch('/events/:eventId/rsvp', controller.updateRsvp);
router.post('/charges/:chargeId/proof', upload.single('file'), controller.uploadPaymentProof);

router.use((error: Error, _req: AuthRequest, res: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ message: 'El comprobante excede el límite de 5 MB' });
    return;
  }
  res.status(400).json({ message: error.message || 'Archivo inválido' });
});

export default router;
