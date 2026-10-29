import { api } from './client';
import type { Modality, SearchResult, TutorPublicProfile } from '../types/api';

export interface SearchFilters {
  categoryId?: string;
  modality?: Modality;
  radiusKm?: number;
  minRating?: number;
  minReviews?: number;
  minPrice?: number;
  maxPrice?: number;
}

export async function searchTutors(filters: SearchFilters) {
  const { data } = await api.get<SearchResult[]>('/tutors/search', { params: filters });
  return data;
}

export async function getTutorProfile(id: string) {
  const { data } = await api.get<TutorPublicProfile>(`/tutors/${id}`);
  return data;
}
