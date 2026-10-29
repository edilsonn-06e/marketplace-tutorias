import { api } from './client';
import type { Report, ReportReason } from '../types/api';

export type MyReport = Report & { reported: { id: string; name: string } };

export interface ReportInput {
  reportedUserId: string;
  reason: ReportReason;
  evidence: string;
}

export async function getMyReports() {
  const { data } = await api.get<MyReport[]>('/reports/mine');
  return data;
}

export async function createReport(input: ReportInput) {
  const { data } = await api.post<Report>('/reports', input);
  return data;
}
