import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';

const modalityEnum = z.enum(['VIRTUAL', 'TUTOR_PLACE', 'STUDENT_HOME']);

export const offerSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(5).max(120),
  description: z.string().max(1000).optional(),
  modalities: z.array(modalityEnum).min(1, 'Elige al menos una modalidad'),
  hourlyRate: z.number().positive().max(5000),
  perKmRate: z.number().min(0).max(100).default(0),
});
export const offerUpdateSchema = offerSchema.partial();

export type OfferInput = z.infer<typeof offerSchema>;
export type OfferUpdateInput = z.infer<typeof offerUpdateSchema>;

async function getOwned(tutorId: string, id: string) {
  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer || offer.tutorId !== tutorId) throw new HttpError(404, 'NOT_FOUND', 'Oferta no encontrada');
  return offer;
}

export function listMine(tutorId: string) {
  return prisma.offer.findMany({
    where: { tutorId },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function create(tutorId: string, data: OfferInput) {
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) throw new HttpError(400, 'INVALID_CATEGORY', 'La categoría no existe');
  return prisma.offer.create({ data: { ...data, tutorId }, include: { category: true } });
}

export async function update(tutorId: string, id: string, data: OfferUpdateInput) {
  await getOwned(tutorId, id);
  return prisma.offer.update({ where: { id }, data, include: { category: true } });
}

export async function deactivate(tutorId: string, id: string) {
  await getOwned(tutorId, id);
  await prisma.offer.update({ where: { id }, data: { active: false } });
}