import { api } from './client';
import type { Category } from '../types/api';

export async function getCategories() {
  const { data } = await api.get<Category[]>('/categories');
  return data;
}