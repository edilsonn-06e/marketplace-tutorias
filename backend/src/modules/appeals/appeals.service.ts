import { z } from 'zod';
import type { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';

export const appealSchema = z.object({
  message: z.string().min(20, 'Explica tu caso con al menos 20 caracteres').max(3000),
});

export async function create(user: User, message: string) {
  if (user.status !== 'SUSPENDED') throw new HttpError(409, 'NOT_SUSPENDED', 'Tu cuenta no está suspendida');
  const pending = await prisma.appeal.findFirst({ where: { userId: user.id, status: 'PENDING' } });
  if (pending) throw new HttpError(409, 'APPEAL_ALREADY_PENDING', 'Ya tienes una apelación en revisión');
  return prisma.appeal.create({ data: { userId: user.id, message } });
}

export function listMine(user: User) {
  return prisma.appeal.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
}
