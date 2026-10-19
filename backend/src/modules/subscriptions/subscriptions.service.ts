import { z } from 'zod';
import { Prisma, type User, type SubscriptionStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { HttpError } from '../../utils/httpError';
import { audit } from '../../utils/audit';
import { HHMM, toMinutes, toHHMM } from '../../utils/time';
import { quoteSchema, computeQuote } from '../quotes/quotes.service';

export const createSubscriptionSchema = quoteSchema.extend({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  startTime: z.string().regex(HHMM, 'Formato HH:mm'),
  notes: z.string().max(500).optional(),
});
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

export const statusSchema = z.object({ status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']) });

interface PlannedSession {
  startAt: Date;
  endAt: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function generateSessions(
  startDate: string,
  weeks: number,
  daysOfWeek: number[],
  startMinute: number,
  durationMinutes: number,
): PlannedSession[] {
  const base = new Date(`${startDate}T00:00:00Z`);
  const sessions: PlannedSession[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const day = new Date(base.getTime() + i * DAY_MS);
    if (!daysOfWeek.includes(day.getUTCDay())) continue;
    const ymd = day.toISOString().slice(0, 10);
    const startAt = new Date(`${ymd}T${toHHMM(startMinute)}:00${env.TIMEZONE_OFFSET}`);
    sessions.push({ startAt, endAt: new Date(startAt.getTime() + durationMinutes * 60_000) });
  }
  return sessions;
}

async function assertWithinAvailability(tutorId: string, days: number[], startMinute: number, endMinute: number) {
  const slots = await prisma.availability.findMany({ where: { tutorId, dayOfWeek: { in: days } } });
  const missing = days.filter(
    (d) => !slots.some((s) => s.dayOfWeek === d && s.startMinute <= startMinute && endMinute <= s.endMinute),
  );
  if (missing.length > 0) {
    throw new HttpError(409, 'OUTSIDE_AVAILABILITY', 'El tutor no está disponible en ese horario', { days: missing });
  }
}

async function withSerializableRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      const retryable = err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034';
      if (!retryable || i >= attempts) throw err;
    }
  }
}

export async function create(student: User, input: CreateSubscriptionInput) {
  const startMinute = toMinutes(input.startTime);
  const endMinute = startMinute + input.durationMinutes;
  if (endMinute > 24 * 60) throw new HttpError(400, 'INVALID_TIME', 'La sesión no puede pasar de medianoche');

  const quote = await computeQuote(student, input);
  const tutorId = quote.tutor.id;
  if (tutorId === student.id) throw new HttpError(400, 'SELF_BOOKING', 'No puedes contratarte a ti mismo');

  await assertWithinAvailability(tutorId, quote.daysOfWeek, startMinute, endMinute);

  const planned = generateSessions(input.startDate, input.weeks, quote.daysOfWeek, startMinute, input.durationMinutes);
  if (planned.length === 0) throw new HttpError(400, 'NO_SESSIONS', 'La combinación de fechas no genera sesiones');
  if (planned[0].startAt <= new Date()) throw new HttpError(400, 'START_IN_PAST', 'La primera sesión ya pasó');

  return withSerializableRetry(() =>
    prisma.$transaction(
      async (tx) => {
        const conflicts = await tx.session.findMany({
          where: {
            status: { in: ['PENDING', 'APPROVED'] },
            OR: [{ tutorId }, { studentId: student.id }],
            AND: [
              {
                OR: planned.map((s) => ({ startAt: { lt: s.endAt }, endAt: { gt: s.startAt } })),
              },
            ],
          },
          select: { startAt: true, endAt: true, studentId: true },
          orderBy: { startAt: 'asc' },
        });

        if (conflicts.length > 0) {
          throw new HttpError(
            409,
            'SCHEDULE_CONFLICT',
            `El horario choca con ${conflicts.length} sesión(es) existente(s)`,
            conflicts.map((c) => ({
              startAt: c.startAt,
              endAt: c.endAt,
              conflictWith: c.studentId === student.id ? 'STUDENT' : 'TUTOR',
            })),
          );
        }

        return tx.subscription.create({
          data: {
            studentId: student.id,
            tutorId,
            offerId: input.offerId,
            modality: input.modality,
            startDate: new Date(`${input.startDate}T00:00:00Z`),
            weeks: input.weeks,
            daysOfWeek: quote.daysOfWeek,
            startMinute,
            durationMinutes: input.durationMinutes,
            distanceKm: quote.distanceKm,
            classCostPerSession: quote.classCostPerSession,
            travelCostPerSession: quote.travelCostPerSession,
            totalCost: quote.totalCost,
            notes: input.notes,
            sessions: {
              create: planned.map((s) => ({ tutorId, studentId: student.id, startAt: s.startAt, endAt: s.endAt })),
            },
          },
          include: { sessions: { orderBy: { startAt: 'asc' } }, offer: { select: { title: true } } },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 10_000 },
    ),
  );
}

export async function listMine(user: User) {
  const subs = await prisma.subscription.findMany({
    where: { OR: [{ studentId: user.id }, { tutorId: user.id }] },
    include: {
      offer: { select: { id: true, title: true, category: { select: { name: true } } } },
      student: { select: { id: true, name: true, photoUrl: true } },
      tutor: { select: { id: true, name: true, photoUrl: true } },
      _count: { select: { sessions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return subs.map((s) => ({ ...s, startTime: toHHMM(s.startMinute) }));
}

export async function changeStatus(user: User, id: string, status: 'APPROVED' | 'REJECTED' | 'CANCELLED') {
  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub || (sub.studentId !== user.id && sub.tutorId !== user.id)) {
    throw new HttpError(404, 'NOT_FOUND', 'Suscripción no encontrada');
  }
  const isTutor = sub.tutorId === user.id;
  const active: SubscriptionStatus[] = ['PENDING', 'APPROVED'];

  if (status === 'APPROVED' || status === 'REJECTED') {
    if (!isTutor) throw new HttpError(403, 'FORBIDDEN', 'Solo el tutor puede aprobar o rechazar');
    if (sub.status !== 'PENDING') throw new HttpError(409, 'INVALID_TRANSITION', `No se puede pasar de ${sub.status} a ${status}`);
  }
  if (status === 'CANCELLED' && !active.includes(sub.status)) {
    throw new HttpError(409, 'INVALID_TRANSITION', `No se puede cancelar una suscripción ${sub.status}`);
  }

  return prisma.$transaction(async (tx) => {
    await tx.session.updateMany({
      where: {
        subscriptionId: id,
        status: { in: ['PENDING', 'APPROVED'] },
        ...(status === 'CANCELLED' ? { startAt: { gt: new Date() } } : {}),
      },
      data: { status: status === 'APPROVED' ? 'APPROVED' : 'CANCELLED' },
    });
    const updated = await tx.subscription.update({ where: { id }, data: { status } });
    await audit(tx, user.id, `SUBSCRIPTION_${status}`, 'Subscription', id);
    return updated;
  });
}