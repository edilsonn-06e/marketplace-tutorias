import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import { HHMM, toMinutes, toHHMM } from '../../utils/time';

export const availabilitySchema = z.object({
  slots: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: z.string().regex(HHMM, 'Formato HH:mm'),
        endTime: z.string().regex(HHMM, 'Formato HH:mm'),
      }),
    )
    .max(50),
});
export type AvailabilityInput = z.infer<typeof availabilitySchema>;

export async function listFor(tutorId: string) {
  const rows = await prisma.availability.findMany({
    where: { tutorId },
    orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
  });
  return rows.map((r) => ({
    id: r.id,
    dayOfWeek: r.dayOfWeek,
    startTime: toHHMM(r.startMinute),
    endTime: toHHMM(r.endMinute),
  }));
}

export async function replaceMine(tutorId: string, { slots }: AvailabilityInput) {
  const parsed = slots.map((s) => ({
    dayOfWeek: s.dayOfWeek,
    startMinute: toMinutes(s.startTime),
    endMinute: toMinutes(s.endTime),
  }));

  for (const s of parsed) {
    if (s.startMinute >= s.endMinute) {
      throw new HttpError(400, 'INVALID_SLOT', 'La hora de inicio debe ser menor que la de fin');
    }
  }

  // Ordenar por día y hora; si un bloque empieza antes de que termine el anterior del mismo día, se traslapan
  const sorted = [...parsed].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startMinute - b.startMinute);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (prev.dayOfWeek === cur.dayOfWeek && cur.startMinute < prev.endMinute) {
      throw new HttpError(400, 'OVERLAPPING_SLOTS', 'Hay bloques de disponibilidad que se traslapan el mismo día');
    }
  }

  await prisma.$transaction([
    prisma.availability.deleteMany({ where: { tutorId } }),
    prisma.availability.createMany({ data: parsed.map((s) => ({ ...s, tutorId })) }),
  ]);

  return listFor(tutorId);
}