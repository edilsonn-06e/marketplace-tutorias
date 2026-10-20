import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/ui/Loader';
import type { Role } from '../types/api';

export function RequireAuth() {
  const { token, user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader text="Conectando con el servidor…" fullScreen />;
  if (!token || !user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function RequireActiveUser() {
  const { user } = useAuth();
  if (user?.status === 'SUSPENDED') return <Navigate to="/suspended" replace />;
  if (!user?.onboarded) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const { user } = useAuth();
  if (!user?.role || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
