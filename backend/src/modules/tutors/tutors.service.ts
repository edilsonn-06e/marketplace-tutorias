import { z } from 'zod';
import type { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import { haversineKm, round2, type Point } from '../../utils/geo';
import { listFor as listAvailability } from '../availability/availability.service';

export const searchSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(500).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  minReviews: z.coerce.number().int().min(0).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  categoryId: z.string().uuid().optional(),
  modality: z.enum(['VIRTUAL', 'TUTOR_PLACE', 'STUDENT_HOME']).optional(),
});
export type SearchQuery = z.infer<typeof searchSchema>;

export async function search(user: User, q: SearchQuery) {
  const origin: Point | null =
    q.lat !== undefined && q.lng !== undefined
      ? { lat: q.lat, lng: q.lng }
      : user.lat !== null && user.lng !== null
        ? { lat: user.lat, lng: user.lng }
        : null;

  let categoryIds: string[] | undefined;
  if (q.categoryId) {
    const children = await prisma.category.findMany({ where: { parentId: q.categoryId }, select: { id: true } });
    categoryIds = [q.categoryId, ...children.map((c) => c.id)];
  }

  const offers = await prisma.offer.findMany({
    where: {
      active: true,
      tutorId: { not: user.id },
      ...(categoryIds && { categoryId: { in: categoryIds } }),
      ...(q.modality && { modalities: { has: q.modality } }),
      hourlyRate: { gte: q.minPrice, lte: q.maxPrice },
      tutor: {
        status: 'ACTIVE',
        tutorProfile: {
          approval: 'APPROVED',
          avgRating: { gte: q.minRating },
          reviewCount: { gte: q.minReviews },
        },
      },
    },
    include: {
      category: { select: { id: true, name: true } },
      tutor: {
        select: {
          id: true, name: true, photoUrl: true, lat: true, lng: true,
          tutorProfile: { select: { avgRating: true, reviewCount: true, bio: true } },
        },
      },
    },
  });

  const results = offers.map((o) => {
    const { lat, lng, ...tutor } = o.tutor;
    const hasPoint = lat !== null && lng !== null;
    return {
      ...o,
      tutor,
      approxLocation: hasPoint ? { lat: Math.round(lat * 100) / 100, lng: Math.round(lng * 100) / 100 } : null,
      distanceKm: origin && hasPoint ? round2(haversineKm(origin, { lat, lng })) : null,
    };
  });

  const radius = q.radiusKm;
  const applyRadius = radius !== undefined && origin !== null && q.modality !== 'VIRTUAL';
  const filtered = applyRadius
    ? results.filter((r) => r.distanceKm !== null && r.distanceKm <= radius)
    : results;

  return filtered.sort(
    (a, b) =>
      (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) ||
      (b.tutor.tutorProfile?.avgRating ?? 0) - (a.tutor.tutorProfile?.avgRating ?? 0),
  );
}

export function listTutorReviews(tutorId: string, take = 20) {
  return prisma.review.findMany({
    where: { tutorId },
    include: { student: { select: { id: true, name: true, photoUrl: true } } },
    orderBy: { createdAt: 'desc' },
    take,
  });
}

export async function getProfile(id: string) {
  const tutor = await prisma.user.findFirst({
    where: { id, role: 'TUTOR', tutorProfile: { approval: 'APPROVED' } },
    select: {
      id: true, name: true, photoUrl: true, createdAt: true,
      tutorProfile: { select: { bio: true, cvUrl: true, baseRate: true, avgRating: true, reviewCount: true } },
      offers: { where: { active: true }, include: { category: true } },
    },
  });
  if (!tutor) throw new HttpError(404, 'NOT_FOUND', 'Tutor no encontrado');

  const [availability, reviews] = await Promise.all([listAvailability(id), listTutorReviews(id, 10)]);
  return { ...tutor, availability, reviews };
}