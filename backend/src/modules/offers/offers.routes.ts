// src/modules/offers/offers.routes.ts
import { Router } from 'express';
import * as ctrl from './offers.controller';
import { requireRole, requireApprovedTutor } from '../../middlewares/roles';

const router = Router();
router.get('/mine', requireRole('TUTOR'), ctrl.listMine);
router.post('/', requireApprovedTutor, ctrl.create);
router.put('/:id', requireApprovedTutor, ctrl.update);
router.delete('/:id', requireApprovedTutor, ctrl.remove);
export default router;
