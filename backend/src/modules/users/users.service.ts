// src/modules/users/users.service.ts
import { z } from 'zod';
import type { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import { getMe } from '../auth/auth.service';

const tutorFields = z.object({
  bio: z.string().min(30, 'La biografía debe tener al menos 30 caracteres').max(2000),
  cvUrl: z.string().url('Debe ser un enlace válido (PDF en Drive o portafolio)'),
  baseRate: z.number().positive().max(5000),
});

export const onboardingSchema = z
  .object({
    role: z.enum(['STUDENT', 'TUTOR']),
    phone: z.string().regex(/^\+?[0-9 ]{8,15}$/, 'Teléfono inválido'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED']),
    address: z.string().min(5).max(200),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    idDocument: z.string().min(5).max(30),
    categoryIds: z.array(z.string().uuid()).min(1, 'Elige al menos una categoría'),
    tutor: tutorFields.optional(),
  })
  .refine((d) => d.role !== 'TUTOR' || d.tutor !== undefined, {
    message: 'Los tutores deben enviar bio, cvUrl y baseRate',
    path: ['tutor'],
  });

export const updateProfileSchema = z.object({
  phone: z.string().regex(/^\+?[0-9 ]{8,15}$/).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED']).optional(),
  address: z.string().min(5).max(200).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  categoryIds: z.array(z.string().uuid()).min(1).optional(),
  tutor: tutorFields.partial().optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

async function assertCategoriesExist(ids: string[]) {
  const count = await prisma.category.count({ where: { id: { in: ids } } });
  if (count !== new Set(ids).size) throw new HttpError(400, 'INVALID_CATEGORY', 'Alguna categoría no existe');
}

export async function completeOnboarding(userId: string, data: OnboardingInput) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.onboarded) throw new HttpError(409, 'ALREADY_ONBOARDED', 'Ya completaste tu perfil');
  await assertCategoriesExist(data.categoryIds);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        role: data.role,
        phone: data.phone,
        gender: data.gender,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        idDocument: data.idDocument,
        onboarded: true,
      },
    });
    await tx.userCategory.createMany({
      data: data.categoryIds.map((categoryId) => ({ userId, categoryId })),
      skipDuplicates: true,
    });
    if (data.role === 'TUTOR' && data.tutor) {
      // approval queda PENDING: un admin debe aprobarlo antes de publicar ofertas
      await tx.tutorProfile.create({ data: { userId, ...data.tutor } });
    }
  });

  return getMe(userId);
}

export async function updateProfile(user: User, data: UpdateProfileInput) {
  if (!user.onboarded) throw new HttpError(403, 'ONBOARDING_REQUIRED', 'Completa tu perfil primero');
  const { categoryIds, tutor, ...fields } = data;
  if (categoryIds) await assertCategoriesExist(categoryIds);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: fields });
    if (categoryIds) {
      await tx.userCategory.deleteMany({ where: { userId: user.id } });
      await tx.userCategory.createMany({ data: categoryIds.map((categoryId) => ({ userId: user.id, categoryId })) });
    }
    if (tutor && user.role === 'TUTOR') {
      await tx.tutorProfile.update({ where: { userId: user.id }, data: tutor });
    }
  });

  return getMe(user.id);
}
