import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { User } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../utils/jwt';
import { HttpError } from '../utils/httpError';
import { currentUser } from '../utils/currentUser';

// Reutilizable: lo usa el middleware HTTP y también Socket.io
export async function authenticate(token: string): Promise<User> {
  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new HttpError(401, 'TOKEN_EXPIRED', 'Tu sesión expiró, inicia sesión de nuevo');
    }
    throw new HttpError(401, 'INVALID_TOKEN', 'Token inválido');
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new HttpError(401, 'INVALID_TOKEN', 'El usuario del token no existe');
  return user;
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Falta el header Authorization: Bearer <token>');
  }
  req.user = await authenticate(header.slice('Bearer '.length));
  next();
};

export const blockSuspended: RequestHandler = (req, _res, next) => {
  const user = currentUser(req);
  if (user.status === 'SUSPENDED') {
    throw new HttpError(403, 'ACCOUNT_SUSPENDED', 'Tu cuenta está suspendida', {
      reason: user.suspendedReason,
      suspendedAt: user.suspendedAt,
    });
  }
  next();
};

export const requireOnboarded: RequestHandler = (req, _res, next) => {
  if (!currentUser(req).onboarded) {
    throw new HttpError(403, 'ONBOARDING_REQUIRED', 'Debes completar tu perfil primero');
  }
  next();
};