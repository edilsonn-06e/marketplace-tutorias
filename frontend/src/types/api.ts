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

export type SubscriptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Quote {
  offer: { id: string; title: string; hourlyRate: number; perKmRate: number };
  tutor: { id: string; name: string };
  modality: Modality;
  weeks: number;
  daysOfWeek: number[];
  sessionsCount: number;
  hoursPerSession: number;
  classCostPerSession: number;
  distanceKm: number | null;
  roundTripKm: number | null;
  travelCostPerSession: number;
  costPerSession: number;
  totalCost: number;
  route: {
    distanceKm: number;
    durationMin: number | null;
    geometry: [number, number][];
    source: 'osrm' | 'estimate';
    from: { lat: number; lng: number };
    to: { lat: number; lng: number };
  } | null;
}

export interface Subscription {
  id: string;
  studentId: string;
  tutorId: string;
  offerId: string;
  modality: Modality;
  startDate: string;
  weeks: number;
  daysOfWeek: number[];
  startMinute: number;
  durationMinutes: number;
  distanceKm: number | null;
  classCostPerSession: number;
  travelCostPerSession: number;
  totalCost: number;
  notes: string | null;
  status: SubscriptionStatus;
  createdAt: string;
}

export interface SubscriptionListItem extends Subscription {
  offer: { id: string; title: string; category: { name: string } };
  student: UserSummary;
  tutor: UserSummary;
  _count: { sessions: number };
  startTime: string;
}

export type SessionStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';

export interface CalendarSession {
  id: string;
  subscriptionId: string;
  tutorId: string;
  studentId: string;
  startAt: string;
  endAt: string;
  status: SessionStatus;
  subscription: {
    id: string;
    modality: Modality;
    status: SubscriptionStatus;
    offer: { title: string; category: { name: string } };
  };
  tutor: UserSummary;
  student: UserSummary;
  review: { id: string; rating: number } | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

export interface Conversation {
  id: string;
  studentId: string;
  tutorId: string;
  createdAt: string;
  updatedAt: string;
  otherUser: UserSummary & { role: Role | null };
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

export type ReportReason = 'NO_SHOW' | 'INAPPROPRIATE_CONDUCT' | 'UNDUE_CHARGES' | 'OTHER';
export type ReportStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: ReportReason;
  evidence: string;
  status: ReportStatus;
  adminNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}
