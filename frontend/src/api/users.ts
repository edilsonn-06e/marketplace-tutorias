import { api } from './client';
import type { Gender, User } from '../types/api';

export interface OnboardingPayload {
  role: 'STUDENT' | 'TUTOR';
  phone: string;
  gender: Gender;
  address: string;
  lat: number;
  lng: number;
  idDocument: string;
  categoryIds: string[];
  tutor?: { bio: string; cvUrl: string; baseRate: number };
}

export async function completeOnboarding(payload: OnboardingPayload) {
  const { data } = await api.put<User>('/users/me/onboarding', payload);
  return data;
}