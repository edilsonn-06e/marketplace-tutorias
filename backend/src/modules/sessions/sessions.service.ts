import { z } from 'zod';
import type { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { HttpError } from '../../utils/httpError';
import { audit } from '../../utils/audit';

export const rangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type RangeQuery = z.infer<typeof rangeSchema>;

export function listMine(user: User, { from, to }: RangeQuery) {
  return prisma.session.findMany({
    where: {
      OR: [{ tutorId: user.id }, { studentId: user.id }],
      startAt: { gte: from, lt: to },
    },
    include: {
      subscription: {
        select: {
          id: true, modality: true, status: true,
          offer: { select: { title: true, category: { select: { name: true } } } },
        },
      },
      tutor: { select: { id: true, name: true, photoUrl: true } },
      student: { select: { id: true, name: true, photoUrl: true } },
      review: { select: { id: true, rating: true } },
    },
    orderBy: { startAt: 'asc' },
  });
}

async function getParticipantSession(user: User, id: string) {
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session || (session.tutorId !== user.id && session.studentId !== user.id)) {
    throw new HttpError(404, 'NOT_FOUND', 'Sesión no encontrada');
  }
  return session;
}

export async function complete(user: User, id: string) {
  const session = await getParticipantSession(user, id);
  if (session.tutorId !== user.id) throw new HttpError(403, 'FORBIDDEN', 'Solo el tutor marca la sesión como cumplida');
  if (session.status !== 'APPROVED') throw new HttpError(409, 'INVALID_TRANSITION', 'Solo sesiones aprobadas pueden completarse');
  if (!env.ALLOW_EARLY_COMPLETE && session.endAt > new Date()) {
    throw new HttpError(409, 'NOT_FINISHED', 'La sesión aún no termina');
  }
  const updated = await prisma.session.update({ where: { id }, data: { status: 'COMPLETED' } });
  await audit(prisma, user.id, 'SESSION_COMPLETED', 'Session', id);
  return updated;
}

export async function cancel(user: User, id: string) {
  const session = await getParticipantSession(user, id);
  if (session.status !== 'PENDING' && session.status !== 'APPROVED') {
    throw new HttpError(409, 'INVALID_TRANSITION', 'La sesión no se puede cancelar');
  }
  const updated = await prisma.session.update({ where: { id }, data: { status: 'CANCELLED' } });
  await audit(prisma, user.id, 'SESSION_CANCELLED', 'Session', id);
  return updated;
}
