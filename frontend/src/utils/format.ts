import type { Modality, Role } from '../types/api';

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

const money = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });

export const formatMoney = (amount: number) => money.format(amount);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-GT', { dateStyle: 'medium' });
