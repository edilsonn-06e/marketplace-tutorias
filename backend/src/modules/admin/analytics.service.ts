import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';

export const monthSchema = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/).optional() });

export async function tutorRanking(limit = 5) {
  const select = {
    avgRating: true,
    reviewCount: true,
    user: { select: { id: true, name: true, photoUrl: true } },
  } as const;
  const where = { approval: 'APPROVED' as const, reviewCount: { gt: 0 } };

  const [best, worst] = await Promise.all([
    prisma.tutorProfile.findMany({ where, select, orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }], take: limit }),
    prisma.tutorProfile.findMany({ where, select, orderBy: [{ avgRating: 'asc' }, { reviewCount: 'desc' }], take: limit }),
  ]);
  return { best, worst };
}

interface DemandRow {
  categoryId: string;
  category: string;
  hours: number;
  sessions: number;
}

export function demandByCategory() {
  return prisma.$queryRaw<DemandRow[]>`
    SELECT c.id AS "categoryId",
           c.name AS category,
           ROUND(SUM(EXTRACT(EPOCH FROM (s."endAt" - s."startAt")) / 3600)::numeric, 2)::float AS hours,
           COUNT(*)::int AS sessions
    FROM "Session" s
    JOIN "Subscription" sub ON sub.id = s."subscriptionId"
    JOIN "Offer" o ON o.id = sub."offerId"
    JOIN "Category" c ON c.id = o."categoryId"
    WHERE s.status IN ('APPROVED', 'COMPLETED')
    GROUP BY c.id, c.name
    ORDER BY hours DESC`;
}

export async function sessionsByMonth(month?: string) {
  const m = month ?? new Date().toISOString().slice(0, 7);
  const [y, mm] = m.split('-').map(Number);
  const next = mm === 12 ? `${y + 1}-01` : `${y}-${String(mm + 1).padStart(2, '0')}`;
  const from = new Date(`${m}-01T00:00:00${env.TIMEZONE_OFFSET}`);
  const to = new Date(`${next}-01T00:00:00${env.TIMEZONE_OFFSET}`);

  const grouped = await prisma.session.groupBy({
    by: ['status'],
    where: { startAt: { gte: from, lt: to } },
    _count: { _all: true },
  });
  const summary = { PENDING: 0, APPROVED: 0, COMPLETED: 0, CANCELLED: 0 };
  for (const g of grouped) summary[g.status] = g._count._all;

  const perDay = await prisma.$queryRaw<{ day: string; completed: number; cancelled: number }[]>`
    SELECT to_char(s."startAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Guatemala', 'YYYY-MM-DD') AS day,
           COUNT(*) FILTER (WHERE s.status = 'COMPLETED')::int AS completed,
           COUNT(*) FILTER (WHERE s.status = 'CANCELLED')::int AS cancelled
    FROM "Session" s
    WHERE s."startAt" >= ${from} AND s."startAt" < ${to}
    GROUP BY day
    ORDER BY day`;

  return { month: m, summary, perDay };
}
