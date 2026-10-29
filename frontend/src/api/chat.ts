import { api } from './client';
import type { ChatMessage, Conversation } from '../types/api';

export async function getConversations() {
  const { data } = await api.get<Conversation[]>('/conversations');
  return data;
}

export async function startConversation(userId: string) {
  const { data } = await api.post<{ id: string }>('/conversations', { userId });
  return data;
}

export async function getMessages(conversationId: string) {
  const { data } = await api.get<ChatMessage[]>(`/conversations/${conversationId}/messages`);
  return data;
}
