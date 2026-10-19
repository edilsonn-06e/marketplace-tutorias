import { Router } from 'express';
import * as ctrl from './reviews.controller';
import { requireRole } from '../../middlewares/roles';

const router = Router();
router.post('/', requireRole('STUDENT'), ctrl.create);
export default router;
