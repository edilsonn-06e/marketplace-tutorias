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

export type AppealStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface Appeal {
  id: string;
  userId: string;
  message: string;
  status: AppealStatus;
  adminResponse: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export type Modality = 'VIRTUAL' | 'TUTOR_PLACE' | 'STUDENT_HOME';

export interface Offer {
  id: string;
  tutorId: string;
  categoryId: string;
  title: string;
  description: string | null;
  modalities: Modality[];
  hourlyRate: number;
  perKmRate: number;
  active: boolean;
  createdAt: string;
  category: Pick<Category, 'id' | 'name'>;
}

export interface SearchResult extends Offer {
  tutor: UserSummary & {
    tutorProfile: Pick<TutorProfile, 'avgRating' | 'reviewCount' | 'bio'> | null;
  };
  approxLocation: { lat: number; lng: number } | null;
  distanceKm: number | null;
}

export interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Review {
  id: string;
  sessionId: string;
  studentId: string;
  tutorId: string;
  rating: number;
  comment: string;
  createdAt: string;
  student: UserSummary;
}

export interface TutorPublicProfile extends UserSummary {
  createdAt: string;
  tutorProfile: Pick<TutorProfile, 'bio' | 'cvUrl' | 'baseRate' | 'avgRating' | 'reviewCount'> | null;
  offers: Offer[];
  availability: AvailabilitySlot[];
  reviews: Review[];
}
