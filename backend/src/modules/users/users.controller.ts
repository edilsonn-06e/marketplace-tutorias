import type { Request, Response } from 'express';
import * as service from './users.service';
import { currentUser } from '../../utils/currentUser';

export async function onboarding(req: Request, res: Response) {
  const data = service.onboardingSchema.parse(req.body);
  res.json(await service.completeOnboarding(currentUser(req).id, data));
}

export async function updateMe(req: Request, res: Response) {
  const data = service.updateProfileSchema.parse(req.body);
  res.json(await service.updateProfile(currentUser(req), data));
}