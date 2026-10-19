import { Router } from 'express';
import * as ctrl from './availability.controller';
import { requireRole } from '../../middlewares/roles';

const router = Router();
router.get('/mine', requireRole('TUTOR'), ctrl.getMine);
router.put('/', requireRole('TUTOR'), ctrl.replaceMine);
export default router;