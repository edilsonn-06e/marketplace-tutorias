import { z } from 'zod';
import type { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import { audit } from '../../utils/audit';
import { round2 } from '../../utils/geo';

export const reviewSchema = z.object({
  sessionId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(1000),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

export async function create(student: User, input: ReviewInput) {
  const session = await prisma.session.findUnique({ where: { id: input.sessionId }, include: { review: true } });
  if (!session || session.studentId !== student.id) throw new HttpError(404, 'NOT_FOUND', 'Sesión no encontrada');
  if (session.status !== 'COMPLETED') throw new HttpError(409, 'SESSION_NOT_COMPLETED', 'Solo puedes calificar sesiones cumplidas');
  if (session.review) throw new HttpError(409, 'ALREADY_REVIEWED', 'Ya calificaste esta sesión');

  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        sessionId: session.id,
        studentId: student.id,
        tutorId: session.tutorId,
        rating: input.rating,
        comment: input.comment,
      },
    });

    const agg = await tx.review.aggregate({
      where: { tutorId: session.tutorId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await tx.tutorProfile.update({
      where: { userId: session.tutorId },
      data: { avgRating: round2(agg._avg.rating ?? 0), reviewCount: agg._count._all },
    });

    await audit(tx, student.id, 'REVIEW_CREATED', 'Review', review.id, { tutorId: session.tutorId, rating: input.rating });
    return review;
  });
}
