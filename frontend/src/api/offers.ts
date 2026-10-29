import { api } from './client';
import type { Modality, Offer } from '../types/api';

export interface OfferInput {
  categoryId: string;
  title: string;
  description: string;
  modalities: Modality[];
  hourlyRate: number;
  perKmRate: number;
}

export async function getMyOffers() {
  const { data } = await api.get<Offer[]>('/offers/mine');
  return data;
}

export async function createOffer(input: OfferInput) {
  const { data } = await api.post<Offer>('/offers', input);
  return data;
}

export async function updateOffer(id: string, input: OfferInput) {
  const { data } = await api.put<Offer>(`/offers/${id}`, input);
  return data;
}

export async function deactivateOffer(id: string) {
  await api.delete(`/offers/${id}`);
}
