import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { HttpError } from '../utils/httpError';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: err.flatten().fieldErrors },
    });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const map: Record<string, [number, string, string]> = {
      P2002: [409, 'DUPLICATE', 'Ya existe un registro con esos datos'],
      P2003: [409, 'IN_USE', 'El registro está siendo usado por otros datos'],
      P2025: [404, 'NOT_FOUND', 'Registro no encontrado'],
      P2034: [409, 'CONCURRENT_CONFLICT', 'Otra operación modificó los mismos datos; intenta de nuevo'],
    };
    const hit = map[err.code];
    if (hit) {
      res.status(hit[0]).json({ error: { code: hit[1], message: hit[2] } });
      return;
    }
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } });
};