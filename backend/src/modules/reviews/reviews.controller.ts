import type { Request, Response } from 'express';
import * as service from './reviews.service';
import { currentUser } from '../../utils/currentUser';

export async function create(req: Request, res: Response) {
  const input = service.reviewSchema.parse(req.body);
  res.status(201).json(await service.create(currentUser(req), input));
}
