import { z } from 'zod';
import type { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import { audit } from '../../utils/audit';

export const reportSchema = z.object({
  reportedUserId: z.string().uuid(),
  reason: z.enum(['NO_SHOW', 'INAPPROPRIATE_CONDUCT', 'UNDUE_CHARGES', 'OTHER']),
  evidence: z.string().min(10, 'Describe la evidencia (mínimo 10 caracteres)').max(2000),
});
export type ReportInput = z.infer<typeof reportSchema>;

export async function create(reporter: User, input: ReportInput) {
  if (input.reportedUserId === reporter.id) throw new HttpError(400, 'SELF_REPORT', 'No puedes reportarte a ti mismo');
  const reported = await prisma.user.findUnique({ where: { id: input.reportedUserId } });
  if (!reported) throw new HttpError(404, 'NOT_FOUND', 'Usuario no encontrado');

  const report = await prisma.report.create({
    data: { reporterId: reporter.id, reportedId: reported.id, reason: input.reason, evidence: input.evidence },
  });
  await audit(prisma, reporter.id, 'REPORT_CREATED', 'Report', report.id, { reportedId: reported.id, reason: input.reason });
  return report;
}

export function listMine(user: User) {
  return prisma.report.findMany({
    where: { reporterId: user.id },
    include: { reported: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
