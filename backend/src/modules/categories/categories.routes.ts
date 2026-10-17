// src/modules/categories/categories.routes.ts
import { Router } from 'express';
import * as ctrl from './categories.controller';
import { requireRole } from '../../middlewares/roles';

const router = Router();
router.get('/', ctrl.list);
router.post('/', requireRole('ADMIN'), ctrl.create);
router.put('/:id', requireRole('ADMIN'), ctrl.update);
router.delete('/:id', requireRole('ADMIN'), ctrl.remove);
export default router;