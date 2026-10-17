// src/modules/offers/offers.controller.ts
import type { Request, Response } from 'express';
import * as service from './offers.service';
import { currentUser } from '../../utils/currentUser';

export async function listMine(req: Request, res: Response) {
  res.json(await service.listMine(currentUser(req).id));
}
export async function create(req: Request, res: Response) {
  const data = service.offerSchema.parse(req.body);
  res.status(201).json(await service.create(currentUser(req).id, data));
}
export async function update(req: Request<{ id: string }>, res: Response) {
  const data = service.offerUpdateSchema.parse(req.body);
  res.json(await service.update(currentUser(req).id, req.params.id, data));
}
export async function remove(req: Request<{ id: string }>, res: Response) {
  await service.deactivate(currentUser(req).id, req.params.id);
  res.status(204).end();
}