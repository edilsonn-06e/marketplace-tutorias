import { api } from './client';
import type { AvailabilitySlot } from '../types/api';

export type SlotInput = Omit<AvailabilitySlot, 'id'>;

export async function getMyAvailability() {
  const { data } = await api.get<AvailabilitySlot[]>('/availability/mine');
  return data;
}

export async function saveAvailability(slots: SlotInput[]) {
  const { data } = await api.put<AvailabilitySlot[]>('/availability', { slots });
  return data;
}
