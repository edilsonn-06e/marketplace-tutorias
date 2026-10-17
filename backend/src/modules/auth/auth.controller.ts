import type { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from './auth.service';
import { currentUser } from '../../utils/currentUser';

const googleSchema = z.object({ credential: z.string().min(10) });
const devSchema = z.object({ email: z.string().email() });

export async function google(req: Request, res: Response) {
  const { credential } = googleSchema.parse(req.body);
  res.json(await authService.loginWithGoogle(credential));
}

export async function devLogin(req: Request, res: Response) {
  const { email } = devSchema.parse(req.body);
  res.json(await authService.devLogin(email));
}

export async function me(req: Request, res: Response) {
  res.json(await authService.getMe(currentUser(req).id));
}