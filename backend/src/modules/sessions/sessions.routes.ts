import { Router } from 'express';
import * as ctrl from './sessions.controller';

const router = Router();
router.get('/mine', ctrl.listMine);
router.patch('/:id/complete', ctrl.complete);
router.patch('/:id/cancel', ctrl.cancel);
export default router;
