import { Router } from 'express';
import { retrainModels, fetchEdaReport } from '../../controllers/ml.controller';
import { authenticateRequest } from '../../middleware/authenticate.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authenticateRequest);
router.use(requireAdmin);

router.post('/retrain', retrainModels);
router.get('/eda', fetchEdaReport);

export default router;

