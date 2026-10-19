import type { Request, Response } from 'express';
import * as service from './chat.service';
import { currentUser } from '../../utils/currentUser';

export async function list(req: Request, res: Response) {
  res.json(await service.listMine(currentUser(req)));
}
export async function start(req: Request, res: Response) {
  const { userId } = service.startSchema.parse(req.body);
  res.status(201).json(await service.startConversation(currentUser(req), userId));
}
export async function messages(req: Request<{ id: string }>, res: Response) {
  const q = service.messagesQuerySchema.parse(req.query);
  res.json(await service.listMessages(currentUser(req), req.params.id, q));
}
export async function read(req: Request<{ id: string }>, res: Response) {
  res.json(await service.markRead(currentUser(req).id, req.params.id));
}
