import type { Request, Response } from 'express';
import * as admin from './admin.service';
import * as analytics from './analytics.service';
import { currentUser } from '../../utils/currentUser';

const adminId = (req: Request) => currentUser(req).id;

export const listUsers = async (req: Request, res: Response) => {
  res.json(await admin.listUsers(admin.userFilterSchema.parse(req.query)));
};
export const userDetail = async (req: Request<{ id: string }>, res: Response) => {
  res.json(await admin.getUserDetail(req.params.id));
};
export const suspend = async (req: Request<{ id: string }>, res: Response) => {
  const { reason } = admin.suspendSchema.parse(req.body);
  res.json(await admin.suspendUser(adminId(req), req.params.id, reason));
};
export const reactivate = async (req: Request<{ id: string }>, res: Response) => {
  res.json(await admin.reactivateUser(adminId(req), req.params.id));
};
export const pendingTutors = async (_req: Request, res: Response) => {
  res.json(await admin.listPendingTutors());
};
export const tutorApproval = async (req: Request<{ id: string }>, res: Response) => {
  const { approval } = admin.approvalSchema.parse(req.body);
  res.json(await admin.setTutorApproval(adminId(req), req.params.id, approval));
};
export const listReports = async (req: Request, res: Response) => {
  res.json(await admin.listReports(admin.statusFilterSchema.parse(req.query).status));
};
export const resolveReport = async (req: Request<{ id: string }>, res: Response) => {
  const input = admin.resolveReportSchema.parse(req.body);
  res.json(await admin.resolveReport(adminId(req), req.params.id, input));
};
export const listAppeals = async (req: Request, res: Response) => {
  res.json(await admin.listAppeals(admin.statusFilterSchema.parse(req.query).status));
};
export const resolveAppeal = async (req: Request<{ id: string }>, res: Response) => {
  const input = admin.resolveAppealSchema.parse(req.body);
  res.json(await admin.resolveAppeal(adminId(req), req.params.id, input));
};
export const auditLogs = async (_req: Request, res: Response) => {
  res.json(await admin.listAuditLogs());
};
export const ranking = async (_req: Request, res: Response) => {
  res.json(await analytics.tutorRanking());
};
export const demand = async (_req: Request, res: Response) => {
  res.json(await analytics.demandByCategory());
};
export const sessionsByMonth = async (req: Request, res: Response) => {
  const { month } = analytics.monthSchema.parse(req.query);
  res.json(await analytics.sessionsByMonth(month));
};
