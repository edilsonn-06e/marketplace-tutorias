import type { ChatMessage } from './api';

type Ack<T = undefined> = (res: { ok: true; data?: T } | { ok: false; error: string }) => void;

export interface ServerToClientEvents {
  'message:new': (message: ChatMessage) => void;
  'message:read': (payload: { conversationId: string; readerId: string; readAt: string }) => void;
  'conversation:updated': (payload: { conversationId: string }) => void;
}

export interface ClientToServerEvents {
  'conversation:join': (conversationId: string, ack?: Ack) => void;
  'conversation:leave': (conversationId: string) => void;
  'message:send': (payload: { conversationId: string; content: string }, ack?: Ack<ChatMessage>) => void;
  'message:read': (payload: { conversationId: string }) => void;
}
