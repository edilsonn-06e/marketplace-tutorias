import type { Request, Response } from 'express';
import * as service from './quotes.service';
import { currentUser } from '../../utils/currentUser';

export async function create(req: Request, res: Response) {
  const input = service.quoteSchema.parse(req.body);
  res.json(await service.computeQuote(currentUser(req), input));
}