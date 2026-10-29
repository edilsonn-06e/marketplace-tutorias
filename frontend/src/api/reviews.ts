import { api } from './client';

export interface ReviewInput {
  sessionId: string;
  rating: number;
  comment: string;
}

export async function createReview(input: ReviewInput) {
  const { data } = await api.post<{ id: string; rating: number }>('/reviews', input);
  return data;
}
