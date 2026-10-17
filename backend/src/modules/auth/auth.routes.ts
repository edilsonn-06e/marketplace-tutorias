
import { Router } from 'express';
import * as ctrl from './auth.controller';
import { requireAuth } from '../../middlewares/auth';

const router = Router();

router.post('/google', ctrl.google);
router.post('/dev-login', ctrl.devLogin);
router.get('/me', requireAuth, ctrl.me);

export default router;