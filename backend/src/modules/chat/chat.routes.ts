import { Router } from 'express';
import * as ctrl from './chat.controller';

const router = Router();
router.get('/', ctrl.list);
router.post('/', ctrl.start);
router.get('/:id/messages', ctrl.messages);
router.patch('/:id/read', ctrl.read);
export default router;
