import { api } from './client';
import type { Modality, Quote, Subscription, SubscriptionListItem } from '../types/api';

export interface QuoteInput {
  offerId: string;
  modality: Modality;
  weeks: number;
  daysOfWeek: number[];
  durationMinutes: number;
}

export interface SubscriptionInput extends QuoteInput {
  startDate: string;
  startTime: string;
  notes?: string;
}

export async function getQuote(input: QuoteInput) {
  const { data } = await api.post<Quote>('/quotes', input);
  return data;
}

export async function createSubscription(input: SubscriptionInput) {
  const { data } = await api.post<Subscription>('/subscriptions', input);
  return data;
}

export async function getMySubscriptions() {
  const { data } = await api.get<SubscriptionListItem[]>('/subscriptions/mine');
  return data;
}

export async function changeSubscriptionStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'CANCELLED') {
  const { data } = await api.patch<Subscription>(`/subscriptions/${id}/status`, { status });
  return data;
}
