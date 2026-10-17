import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

type Db = Prisma.TransactionClient | typeof prisma;

export function audit(
  db: Db,
  actorId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  details?: Prisma.InputJsonValue,
) {
  return db.auditLog.create({ data: { actorId, action, entity, entityId, details } });
}