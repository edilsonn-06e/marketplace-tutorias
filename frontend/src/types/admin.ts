import type { Appeal, Category, Report, Role, SessionStatus, TutorProfile, UserStatus, UserSummary } from './api';

export interface AdminUserRow extends UserSummary {
  email: string;
  role: Role | null;
  status: UserStatus;
  createdAt: string;
  tutorProfile: Pick<TutorProfile, 'approval' | 'avgRating' | 'reviewCount'> | null;
  _count: { reportsReceived: number };
}

export interface AdminUserDetail extends UserSummary {
  email: string;
  role: Role | null;
  status: UserStatus;
  suspendedReason: string | null;
  suspendedAt: string | null;
  reportsReceived: (Report & { reporter: { id: string; name: string } })[];
  reportsMade: (Report & { reported: { id: string; name: string } })[];
  appeals: Appeal[];
}

export interface PendingTutor extends UserSummary {
  email: string;
  createdAt: string;
  tutorProfile: TutorProfile;
  categories: { category: Category }[];
}

export interface AdminReport extends Report {
  reporter: { id: string; name: string; email: string };
  reported: { id: string; name: string; email: string; status: UserStatus; _count: { reportsReceived: number } };
}

export interface AdminAppeal extends Appeal {
  user: UserSummary & { email: string; suspendedReason: string | null; suspendedAt: string | null };
}

export interface RankingEntry {
  avgRating: number;
  reviewCount: number;
  user: UserSummary;
}

export interface DemandRow {
  categoryId: string;
  category: string;
  hours: number;
  sessions: number;
}

export interface MonthStats {
  month: string;
  summary: Record<SessionStatus, number>;
  perDay: { day: string; completed: number; cancelled: number }[];
}
