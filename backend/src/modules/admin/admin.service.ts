import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import { audit } from '../../utils/audit';

export const userFilterSchema = z.object({
  role: z.enum(['STUDENT', 'TUTOR', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  q: z.string().max(100).optional(),
});
export const suspendSchema = z.object({ reason: z.string().min(5).max(500) });
export const approvalSchema = z.object({ approval: z.enum(['APPROVED', 'REJECTED']) });
export const statusFilterSchema = z.object({ status: z.string().optional() });
export const resolveReportSchema = z
  .object({
    status: z.enum(['RESOLVED', 'DISMISSED']),
    adminNote: z.string().max(1000).optional(),
    suspendUser: z.boolean().default(false),
    suspendReason: z.string().min(5).max(500).optional(),
  })
  .refine((d) => !d.suspendUser || !!d.suspendReason, { message: 'Indica el motivo de la suspensión', path: ['suspendReason'] });
export const resolveAppealSchema = z.object({
  decision: z.enum(['ACCEPTED', 'REJECTED']),
  adminResponse: z.string().max(1000).optional(),
});

export function listUsers({ role, status, q }: z.infer<typeof userFilterSchema>) {
  return prisma.user.findMany({
    where: {
      role,
      status,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { email: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    select: {
      id: true, name: true, email: true, photoUrl: true, role: true, status: true, createdAt: true,
      tutorProfile: { select: { approval: true, avgRating: true, reviewCount: true } },
      _count: { select: { reportsReceived: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}

export async function getUserDetail(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      tutorProfile: true,
      reportsReceived: { include: { reporter: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
      reportsMade: { include: { reported: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
      appeals: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'Usuario no encontrado');
  return user;
}

export async function suspendUser(adminId: string, userId: string, reason: string) {
  if (adminId === userId) throw new HttpError(400, 'SELF_SUSPEND', 'No puedes suspenderte a ti mismo');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'Usuario no encontrado');
  if (user.role === 'ADMIN') throw new HttpError(400, 'CANNOT_SUSPEND_ADMIN', 'No se puede suspender a un administrador');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED', suspendedReason: reason, suspendedAt: new Date() },
    });
    await audit(tx, adminId, 'USER_SUSPENDED', 'User', userId, { reason });
    return updated;
  });
}

export async function reactivateUser(adminId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE', suspendedReason: null, suspendedAt: null },
    });
    await tx.appeal.updateMany({
      where: { userId, status: 'PENDING' },
      data: { status: 'ACCEPTED', adminResponse: 'Cuenta reactivada por el administrador', resolvedAt: new Date() },
    });
    await audit(tx, adminId, 'USER_REACTIVATED', 'User', userId);
    return updated;
  });
}

export function listPendingTutors() {
  return prisma.user.findMany({
    where: { role: 'TUTOR', tutorProfile: { approval: 'PENDING' } },
    include: { tutorProfile: true, categories: { include: { category: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function setTutorApproval(adminId: string, tutorId: string, approval: 'APPROVED' | 'REJECTED') {
  const profile = await prisma.tutorProfile.update({ where: { userId: tutorId }, data: { approval } });
  await audit(prisma, adminId, `TUTOR_${approval}`, 'TutorProfile', tutorId);
  return profile;
}

export function listReports(status?: string) {
  return prisma.report.findMany({
    where: status ? { status: status as 'OPEN' | 'RESOLVED' | 'DISMISSED' } : {},
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      reported: { select: { id: true, name: true, email: true, status: true, _count: { select: { reportsReceived: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function resolveReport(adminId: string, id: string, input: z.infer<typeof resolveReportSchema>) {
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) throw new HttpError(404, 'NOT_FOUND', 'Reporte no encontrado');
  if (report.status !== 'OPEN') throw new HttpError(409, 'ALREADY_RESOLVED', 'El reporte ya fue atendido');

  const updated = await prisma.report.update({
    where: { id },
    data: { status: input.status, adminNote: input.adminNote, resolvedAt: new Date() },
  });
  await audit(prisma, adminId, `REPORT_${input.status}`, 'Report', id);
  if (input.suspendUser && input.suspendReason) {
    await suspendUser(adminId, report.reportedId, input.suspendReason);
  }
  return updated;
}

export function listAppeals(status?: string) {
  return prisma.appeal.findMany({
    where: status ? { status: status as 'PENDING' | 'ACCEPTED' | 'REJECTED' } : {},
    include: {
      user: { select: { id: true, name: true, email: true, photoUrl: true, suspendedReason: true, suspendedAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function resolveAppeal(adminId: string, id: string, input: z.infer<typeof resolveAppealSchema>) {
  const appeal = await prisma.appeal.findUnique({ where: { id } });
  if (!appeal) throw new HttpError(404, 'NOT_FOUND', 'Apelación no encontrada');
  if (appeal.status !== 'PENDING') throw new HttpError(409, 'ALREADY_RESOLVED', 'La apelación ya fue resuelta');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.appeal.update({
      where: { id },
      data: { status: input.decision, adminResponse: input.adminResponse, resolvedAt: new Date() },
    });
    if (input.decision === 'ACCEPTED') {
      await tx.user.update({
        where: { id: appeal.userId },
        data: { status: 'ACTIVE', suspendedReason: null, suspendedAt: null },
      });
    }
    await audit(tx, adminId, `APPEAL_${input.decision}`, 'Appeal', id, { userId: appeal.userId });
    return updated;
  });
}

export function listAuditLogs() {
  return prisma.auditLog.findMany({
    include: { actor: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}
