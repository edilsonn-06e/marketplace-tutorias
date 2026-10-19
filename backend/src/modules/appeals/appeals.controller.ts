import type { Request, Response } from 'express';
import * as service from './appeals.service';
import { currentUser } from '../../utils/currentUser';

export async function create(req: Request, res: Response) {
  const { message } = service.appealSchema.parse(req.body);
  res.status(201).json(await service.create(currentUser(req), message));
}
export async function listMine(req: Request, res: Response) {
  res.json(await service.listMine(currentUser(req)));
}
