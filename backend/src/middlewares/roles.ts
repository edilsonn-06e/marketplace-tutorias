import type { RequestHandler } from 'express';
import type { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { HttpError } from '../utils/httpError';
import { currentUser } from '../utils/currentUser';

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    const user = currentUser(req);
    if (!user.role || !roles.includes(user.role)) {
      throw new HttpError(403, 'FORBIDDEN', 'No tienes permiso para esta acción');
    }
    next();
  };

export const requireApprovedTutor: RequestHandler = async (req, _res, next) => {
  const user = currentUser(req);
  if (user.role !== 'TUTOR') throw new HttpError(403, 'FORBIDDEN', 'Solo para tutores');
  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
  if (profile?.approval !== 'APPROVED') {
    throw new HttpError(403, 'TUTOR_NOT_APPROVED', 'Tu perfil de tutor aún no fue aprobado por un administrador');
  }
  next();
};