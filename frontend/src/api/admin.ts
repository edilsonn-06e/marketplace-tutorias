import { api } from './client';
import type { Category, Role, UserStatus } from '../types/api';
import type {
  AdminAppeal,
  AdminReport,
  AdminUserDetail,
  AdminUserRow,
  DemandRow,
  MonthStats,
  PendingTutor,
  RankingEntry,
} from '../types/admin';

export interface CategoryInput {
  name: string;
  description?: string;
  parentId: string | null;
}

export async function createCategory(input: CategoryInput) {
  const { data } = await api.post<Category>('/categories', input);
  return data;
}

export async function updateCategory(id: string, input: CategoryInput) {
  const { data } = await api.put<Category>(`/categories/${id}`, input);
  return data;
}

export async function deleteCategory(id: string) {
  await api.delete(`/categories/${id}`);
}

export async function getUsers(params: { role?: Role; status?: UserStatus; q?: string }) {
  const { data } = await api.get<AdminUserRow[]>('/admin/users', { params });
  return data;
}

export async function getUserDetail(id: string) {
  const { data } = await api.get<AdminUserDetail>(`/admin/users/${id}`);
  return data;
}

export async function suspendUser(id: string, reason: string) {
  await api.patch(`/admin/users/${id}/suspend`, { reason });
}

export async function reactivateUser(id: string) {
  await api.patch(`/admin/users/${id}/reactivate`);
}

export async function getPendingTutors() {
  const { data } = await api.get<PendingTutor[]>('/admin/tutors/pending');
  return data;
}

export async function setTutorApproval(id: string, approval: 'APPROVED' | 'REJECTED') {
  await api.patch(`/admin/tutors/${id}/approval`, { approval });
}

export async function getReports(status?: string) {
  const { data } = await api.get<AdminReport[]>('/admin/reports', { params: { status } });
  return data;
}

export interface ResolveReportInput {
  status: 'RESOLVED' | 'DISMISSED';
  adminNote?: string;
  suspendUser: boolean;
  suspendReason?: string;
}

export async function resolveReport(id: string, input: ResolveReportInput) {
  await api.patch(`/admin/reports/${id}`, input);
}

export async function getAppeals(status?: string) {
  const { data } = await api.get<AdminAppeal[]>('/admin/appeals', { params: { status } });
  return data;
}

export async function resolveAppeal(id: string, decision: 'ACCEPTED' | 'REJECTED', adminResponse?: string) {
  await api.patch(`/admin/appeals/${id}`, { decision, adminResponse });
}

export async function getRanking() {
  const { data } = await api.get<{ best: RankingEntry[]; worst: RankingEntry[] }>('/admin/analytics/tutor-ranking');
  return data;
}

export async function getDemand() {
  const { data } = await api.get<DemandRow[]>('/admin/analytics/demand');
  return data;
}

export async function getMonthStats(month: string) {
  const { data } = await api.get<MonthStats>('/admin/analytics/sessions-by-month', { params: { month } });
  return data;
}
