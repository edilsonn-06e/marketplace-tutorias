import type { Role } from '../../types/api';

export interface NavItem {
  to: string;
  label: string;
  description: string;
}

const HOME: NavItem = { to: '/', label: 'Inicio', description: 'Resumen de tu cuenta' };

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  STUDENT: [
    HOME,
    { to: '/search', label: 'Buscar tutores', description: 'Encuentra tutores cerca de ti' },
    { to: '/subscriptions', label: 'Mis contrataciones', description: 'Estado de tus solicitudes de tutoría' },
    { to: '/calendar', label: 'Calendario', description: 'Tus clases por día, semana o mes' },
    { to: '/chat', label: 'Mensajes', description: 'Habla con tus tutores' },
    { to: '/reports', label: 'Denuncias', description: 'Reporta una conducta indebida' },
  ],
  TUTOR: [
    HOME,
    { to: '/tutor/offers', label: 'Mis ofertas', description: 'Publica y edita tus tutorías' },
    { to: '/tutor/availability', label: 'Disponibilidad', description: 'Define tu horario semanal' },
    { to: '/subscriptions', label: 'Solicitudes', description: 'Aprueba o rechaza contrataciones' },
    { to: '/calendar', label: 'Calendario', description: 'Tus clases por día, semana o mes' },
    { to: '/chat', label: 'Mensajes', description: 'Habla con tus estudiantes' },
    { to: '/reports', label: 'Denuncias', description: 'Reporta una conducta indebida' },
  ],
  ADMIN: [
    HOME,
    { to: '/admin/categories', label: 'Categorías', description: 'Catálogo de categorías y subcategorías' },
    { to: '/admin/moderation', label: 'Moderación', description: 'Tutores, denuncias y apelaciones' },
    { to: '/admin/analytics', label: 'Reportes', description: 'Rankings, demanda y estadísticas' },
  ],
};