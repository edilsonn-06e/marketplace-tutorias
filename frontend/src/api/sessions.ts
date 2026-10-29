import { api } from './client';
import type { CalendarSession } from '../types/api';

export async function getMySessions() {
  const { data } = await api.get<CalendarSession[]>('/sessions/mine');
  return data;
}

export async function completeSession(id: string) {
  await api.patch(`/sessions/${id}/complete`);
}

export async function cancelSession(id: string) {
  await api.patch(`/sessions/${id}/cancel`);
}
