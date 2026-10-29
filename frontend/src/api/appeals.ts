import { api } from './client';
import type { Appeal } from '../types/api';

export async function getMyAppeals() {
  const { data } = await api.get<Appeal[]>('/appeals/mine');
  return data;
}

export async function createAppeal(message: string) {
  const { data } = await api.post<Appeal>('/appeals', { message });
  return data;
}