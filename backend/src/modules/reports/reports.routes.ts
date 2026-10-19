import { Router } from 'express';
import * as ctrl from './reports.controller';

const router = Router();
router.post('/', ctrl.create);
router.get('/mine', ctrl.listMine);
export default router;
