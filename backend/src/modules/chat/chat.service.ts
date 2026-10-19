import { z } from 'zod';
import type { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';

const participant = { select: { id: true, name: true, photoUrl: true, role: true } } as const;

export const startSchema = z.object({ userId: z.string().uuid() });
export const messagesQuerySchema = z.object({
  before: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type MessagesQuery = z.infer<typeof messagesQuerySchema>;

export async function assertParticipant(userId: string, conversationId: string) {
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv || (conv.studentId !== userId && conv.tutorId !== userId)) {
    throw new HttpError(404, 'NOT_FOUND', 'Conversación no encontrada');
  }
  return conv;
}

export async function startConversation(me: User, otherUserId: string) {
  const other = await prisma.user.findUnique({ where: { id: otherUserId } });
  if (!other) throw new HttpError(404, 'NOT_FOUND', 'Usuario no encontrado');

  let studentId: string;
  let tutorId: string;
  if (me.role === 'STUDENT' && other.role === 'TUTOR') {
    studentId = me.id;
    tutorId = other.id;
  } else if (me.role === 'TUTOR' && other.role === 'STUDENT') {
    studentId = other.id;
    tutorId = me.id;
  } else {
    throw new HttpError(400, 'INVALID_PARTICIPANTS', 'El chat es entre un estudiante y un tutor');
  }

  return prisma.conversation.upsert({
    where: { studentId_tutorId: { studentId, tutorId } },
    update: {},
    create: { studentId, tutorId },
    include: { student: participant, tutor: participant },
  });
}

export async function listMine(me: User) {
  const convs = await prisma.conversation.findMany({
    where: { OR: [{ studentId: me.id }, { tutorId: me.id }] },
    include: {
      student: participant,
      tutor: participant,
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { messages: { where: { readAt: null, senderId: { not: me.id } } } } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  return convs.map(({ messages, _count, ...c }) => ({
    ...c,
    otherUser: c.studentId === me.id ? c.tutor : c.student,
    lastMessage: messages[0] ?? null,
    unreadCount: _count.messages,
  }));
}

export async function listMessages(me: User, conversationId: string, { before, limit }: MessagesQuery) {
  await assertParticipant(me.id, conversationId);
  const msgs = await prisma.message.findMany({
    where: { conversationId, createdAt: { lt: before } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return msgs.reverse();
}

export async function sendMessage(senderId: string, conversationId: string, content: string) {
  const conv = await assertParticipant(senderId, conversationId);
  const [message] = await prisma.$transaction([
    prisma.message.create({ data: { conversationId, senderId, content } }),
    prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
  ]);
  const recipientId = conv.studentId === senderId ? conv.tutorId : conv.studentId;
  return { message, recipientId };
}

export async function markRead(readerId: string, conversationId: string) {
  await assertParticipant(readerId, conversationId);
  const readAt = new Date();
  const result = await prisma.message.updateMany({
    where: { conversationId, senderId: { not: readerId }, readAt: null },
    data: { readAt },
  });
  return { count: result.count, readAt };
}
