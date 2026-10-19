import type { Request, Response } from 'express';
import * as service from './sessions.service';
import { currentUser } from '../../utils/currentUser';

export async function listMine(req: Request, res: Response) {
  const range = service.rangeSchema.parse(req.query);
  res.json(await service.listMine(currentUser(req), range));
}
export async function complete(req: Request<{ id: string }>, res: Response) {
  res.json(await service.complete(currentUser(req), req.params.id));
}
export async function cancel(req: Request<{ id: string }>, res: Response) {
  res.json(await service.cancel(currentUser(req), req.params.id));
}
