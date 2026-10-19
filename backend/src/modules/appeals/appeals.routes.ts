import { Router } from 'express';
import * as ctrl from './appeals.controller';

const router = Router();
router.get('/mine', ctrl.listMine);
router.post('/', ctrl.create);
export default router;
