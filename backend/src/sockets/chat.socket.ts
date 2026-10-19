import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import type { Message, User } from '@prisma/client';
import { env } from '../config/env';
import { authenticate } from '../middlewares/auth';
import { HttpError } from '../utils/httpError';
import { assertParticipant, sendMessage, markRead } from '../modules/chat/chat.service';

type Ack<T = undefined> = (res: { ok: true; data?: T } | { ok: false; error: string }) => void;

interface ServerToClientEvents {
  'message:new': (message: Message) => void;
  'message:read': (payload: { conversationId: string; readerId: string; readAt: Date }) => void;
  'conversation:updated': (payload: { conversationId: string }) => void;
}

interface ClientToServerEvents {
  'conversation:join': (conversationId: string, ack?: Ack) => void;
  'conversation:leave': (conversationId: string) => void;
  'message:send': (payload: { conversationId: string; content: string }, ack?: Ack<Message>) => void;
  'message:read': (payload: { conversationId: string }) => void;
}

interface SocketData {
  user: User;
}

export function initChatSocket(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
    cors: { origin: env.FRONTEND_URLS },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== 'string') throw new HttpError(401, 'UNAUTHORIZED', 'Falta token');
      const user = await authenticate(token);
      if (user.status === 'SUSPENDED') throw new HttpError(403, 'ACCOUNT_SUSPENDED', 'Cuenta suspendida');
      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error(err instanceof HttpError ? err.code : 'UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    socket.join(`user:${user.id}`);

    socket.on('conversation:join', async (conversationId, ack) => {
      try {
        await assertParticipant(user.id, conversationId);
        await socket.join(`conv:${conversationId}`);
        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false, error: 'No perteneces a esta conversación' });
      }
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on('message:send', async ({ conversationId, content }, ack) => {
      try {
        const text = String(content ?? '').trim();
        if (!text || text.length > 2000) throw new Error('Mensaje vacío o demasiado largo');
        const { message, recipientId } = await sendMessage(user.id, conversationId, text);
        io.to(`conv:${conversationId}`).emit('message:new', message);
        io.to(`user:${recipientId}`).emit('conversation:updated', { conversationId });
        ack?.({ ok: true, data: message });
      } catch (err) {
        ack?.({ ok: false, error: err instanceof Error ? err.message : 'Error al enviar' });
      }
    });

    socket.on('message:read', async ({ conversationId }) => {
      try {
        const { count, readAt } = await markRead(user.id, conversationId);
        if (count > 0) {
          io.to(`conv:${conversationId}`).emit('message:read', { conversationId, readerId: user.id, readAt });
        }
      } catch {
        return;
      }
    });
  });

  return io;
}
