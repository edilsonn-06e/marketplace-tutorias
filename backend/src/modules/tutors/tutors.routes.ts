import { Router } from 'express';
import * as ctrl from './tutors.controller';

const router = Router();
router.get('/search', ctrl.search);
router.get('/:id', ctrl.profile);
router.get('/:id/reviews', ctrl.reviews);
export default router;