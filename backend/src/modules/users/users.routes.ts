import { Router } from 'express';
import * as ctrl from './users.controller';

const router = Router();
router.put('/me/onboarding', ctrl.onboarding);
router.patch('/me', ctrl.updateMe);
export default router;