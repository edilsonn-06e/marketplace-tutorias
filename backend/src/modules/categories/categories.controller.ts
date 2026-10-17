// src/modules/categories/categories.controller.ts
import type { Request, Response } from 'express';
import * as service from './categories.service';
import { currentUser } from '../../utils/currentUser';

export async function list(_req: Request, res: Response) {
  res.json(await service.listTree());
}
export async function create(req: Request, res: Response) {
  const data = service.categorySchema.parse(req.body);
  res.status(201).json(await service.create(currentUser(req).id, data));
}
export async function update(req: Request<{ id: string }>, res: Response) {
  const data = service.categorySchema.parse(req.body);
  res.json(await service.update(currentUser(req).id, req.params.id, data));
}
export async function remove(req: Request<{ id: string }>, res: Response) {
  await service.remove(currentUser(req).id, req.params.id);
  res.status(204).end();
}