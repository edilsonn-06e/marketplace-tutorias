import type { Request } from 'express';
import type { User } from '@prisma/client';
import { HttpError } from './httpError';

export function currentUser(req: Request): User {
  if (!req.user) throw new HttpError(401, 'UNAUTHORIZED', 'No autenticado');
  return req.user;
}