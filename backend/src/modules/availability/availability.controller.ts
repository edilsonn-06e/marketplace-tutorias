import type { Request, Response } from 'express';
import * as service from './availability.service';
import { currentUser } from '../../utils/currentUser';

export async function getMine(req: Request, res: Response) {
  res.json(await service.listFor(currentUser(req).id));
}
export async function replaceMine(req: Request, res: Response) {
  const data = service.availabilitySchema.parse(req.body);
  res.json(await service.replaceMine(currentUser(req).id, data));
}