// src/modules/tutors/tutors.controller.ts
import type { Request, Response } from 'express';
import * as service from './tutors.service';
import { currentUser } from '../../utils/currentUser';

export async function search(req: Request, res: Response) {
  const q = service.searchSchema.parse(req.query);
  res.json(await service.search(currentUser(req), q));
}
export async function profile(req: Request<{ id: string }>, res: Response) {
  res.json(await service.getProfile(req.params.id));
}
export async function reviews(req: Request<{ id: string }>, res: Response) {
  res.json(await service.listTutorReviews(req.params.id, 100));
}