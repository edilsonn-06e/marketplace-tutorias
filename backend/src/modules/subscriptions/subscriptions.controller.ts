// src/modules/subscriptions/subscriptions.controller.ts
import type { Request, Response } from 'express';
import * as service from './subscriptions.service';
import { currentUser } from '../../utils/currentUser';

export async function create(req: Request, res: Response) {
  const input = service.createSubscriptionSchema.parse(req.body);
  res.status(201).json(await service.create(currentUser(req), input));
}
export async function listMine(req: Request, res: Response) {
  res.json(await service.listMine(currentUser(req)));
}
export async function changeStatus(req: Request<{ id: string }>, res: Response) {
  const { status } = service.statusSchema.parse(req.body);
  res.json(await service.changeStatus(currentUser(req), req.params.id, status));
}