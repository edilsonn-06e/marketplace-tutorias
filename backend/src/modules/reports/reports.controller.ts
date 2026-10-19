import type { Request, Response } from 'express';
import * as service from './reports.service';
import { currentUser } from '../../utils/currentUser';

export async function create(req: Request, res: Response) {
  const input = service.reportSchema.parse(req.body);
  res.status(201).json(await service.create(currentUser(req), input));
}
export async function listMine(req: Request, res: Response) {
  res.json(await service.listMine(currentUser(req)));
}
