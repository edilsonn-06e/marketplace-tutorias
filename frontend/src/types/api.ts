export type Role = 'STUDENT' | 'TUTOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED';
export type TutorApproval = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserSummary { id: string; name: string; photoUrl: string | null }

export interface TutorProfile {
  userId: string;
  bio: string;
  cvUrl: string;
  baseRate: number;
  approval: TutorApproval;
  avgRating: number;
  reviewCount: number;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  children?: Category[];
}

export interface User extends UserSummary {
  email: string;
  role: Role | null;
  onboarded: boolean;
  phone: string | null;
  gender: Gender | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  idDocument: string | null;
  status: UserStatus;
  suspendedReason: string | null;
  suspendedAt: string | null;
  createdAt: string;
  tutorProfile: TutorProfile | null;
  categories: { category: Category }[];
}

export interface AuthResponse { token: string; user: User }

export interface ApiErrorBody { error: { code: string; message: string; details?: unknown } }
