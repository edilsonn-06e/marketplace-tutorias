import { Router } from 'express';
import * as ctrl from './admin.controller';

const router = Router();
router.get('/users', ctrl.listUsers);
router.get('/users/:id', ctrl.userDetail);
router.patch('/users/:id/suspend', ctrl.suspend);
router.patch('/users/:id/reactivate', ctrl.reactivate);
router.get('/tutors/pending', ctrl.pendingTutors);
router.patch('/tutors/:id/approval', ctrl.tutorApproval);
router.get('/reports', ctrl.listReports);
router.patch('/reports/:id', ctrl.resolveReport);
router.get('/appeals', ctrl.listAppeals);
router.patch('/appeals/:id', ctrl.resolveAppeal);
router.get('/audit-logs', ctrl.auditLogs);
router.get('/analytics/tutor-ranking', ctrl.ranking);
router.get('/analytics/demand', ctrl.demand);
router.get('/analytics/sessions-by-month', ctrl.sessionsByMonth);
export default router;
