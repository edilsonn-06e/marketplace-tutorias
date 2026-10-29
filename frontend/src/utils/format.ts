import type { Modality, ReportReason, Role, SessionStatus } from '../types/api';

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: 'Estudiante',
  TUTOR: 'Tutor',
  ADMIN: 'Administrador',
};

export const MODALITY_LABEL: Record<Modality, string> = {
  VIRTUAL: 'Virtual',
  TUTOR_PLACE: 'En casa del tutor',
  STUDENT_HOME: 'A domicilio',
};

export const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const money = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });

export const formatMoney = (amount: number) => money.format(amount);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-GT', { dateStyle: 'medium' });

export const formatDateOnly = (iso: string) =>
  new Date(iso).toLocaleDateString('es-GT', { dateStyle: 'medium', timeZone: 'UTC' });

export const SESSION_LABEL: Record<SessionStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  COMPLETED: 'Cumplida',
  CANCELLED: 'Cancelada',
};

export const formatTime = (date: Date) =>
  date.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });

export const formatMessageTime = (iso: string) => {
  const date = new Date(iso);
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? formatTime(date)
    : `${date.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })} ${formatTime(date)}`;
};

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  NO_SHOW: 'Inasistencia',
  INAPPROPRIATE_CONDUCT: 'Conducta inapropiada',
  UNDUE_CHARGES: 'Cobros indebidos',
  OTHER: 'Otro',
};
