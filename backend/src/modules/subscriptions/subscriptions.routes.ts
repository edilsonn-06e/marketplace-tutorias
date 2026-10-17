// src/modules/subscriptions/subscriptions.routes.ts
import { Router } from 'express';
import * as ctrl from './subscriptions.controller';
import { requireRole } from '../../middlewares/roles';

const router = Router();
router.post('/', requireRole('STUDENT'), ctrl.create);
router.get('/mine', ctrl.listMine);
router.patch('/:id/status', ctrl.changeStatus);
export default router;