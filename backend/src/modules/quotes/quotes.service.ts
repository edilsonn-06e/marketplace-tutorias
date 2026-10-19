import { z } from 'zod';
import type { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import { getRoute, round2, type Point, type RouteResult } from '../../utils/geo';

export const quoteSchema = z.object({
  offerId: z.string().uuid(),
  modality: z.enum(['VIRTUAL', 'TUTOR_PLACE', 'STUDENT_HOME']),
  weeks: z.number().int().min(1).max(24),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  durationMinutes: z.number().int().min(30).max(240),
});
export type QuoteInput = z.infer<typeof quoteSchema>;

const pointOf = (u: { lat: number | null; lng: number | null }): Point | null =>
  u.lat !== null && u.lng !== null ? { lat: u.lat, lng: u.lng } : null;

export async function computeQuote(student: User, input: QuoteInput) {
  const offer = await prisma.offer.findUnique({ where: { id: input.offerId }, include: { tutor: true } });
  if (!offer || !offer.active) throw new HttpError(404, 'NOT_FOUND', 'Oferta no encontrada');
  if (!offer.modalities.includes(input.modality)) {
    throw new HttpError(400, 'MODALITY_NOT_OFFERED', 'El tutor no ofrece esa modalidad');
  }

  const days = [...new Set(input.daysOfWeek)];
  const sessionsCount = input.weeks * days.length;
  const hoursPerSession = input.durationMinutes / 60;
  const classCostPerSession = round2(offer.hourlyRate * hoursPerSession);

  let route: (RouteResult & { from: Point; to: Point }) | null = null;
  let travelCostPerSession = 0;

  if (input.modality !== 'VIRTUAL') {
    const tutorPoint = pointOf(offer.tutor);
    const studentPoint = pointOf(student);
    if (!tutorPoint || !studentPoint) {
      throw new HttpError(400, 'MISSING_LOCATION', 'Falta la ubicación del tutor o del estudiante');
    }
    const r = await getRoute(tutorPoint, studentPoint);
    route = { ...r, from: tutorPoint, to: studentPoint };
    if (input.modality === 'STUDENT_HOME') {
      travelCostPerSession = round2(r.distanceKm * 2 * offer.perKmRate);
    }
  }

  const costPerSession = round2(classCostPerSession + travelCostPerSession);

  return {
    offer: { id: offer.id, title: offer.title, hourlyRate: offer.hourlyRate, perKmRate: offer.perKmRate },
    tutor: { id: offer.tutor.id, name: offer.tutor.name },
    modality: input.modality,
    weeks: input.weeks,
    daysOfWeek: days,
    sessionsCount,
    hoursPerSession,
    classCostPerSession,
    distanceKm: route?.distanceKm ?? null,
    roundTripKm: input.modality === 'STUDENT_HOME' && route ? round2(route.distanceKm * 2) : null,
    travelCostPerSession,
    costPerSession,
    totalCost: round2(costPerSession * sessionsCount),
    route,
  };
}