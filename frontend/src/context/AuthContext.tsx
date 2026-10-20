import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, TOKEN_KEY } from '../api/client';
import type { AuthResponse, User } from '../types/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  loginWithGoogle: (credential: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<User>('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [token, logout]);

  useEffect(() => {
    if (!token) return;
    const expiry = getTokenExpiry(token);
    if (!expiry) return;
    const ms = expiry - Date.now();
    if (ms <= 0) {
      logout();
      return;
    }
    const id = window.setTimeout(() => {
      logout();
      window.location.href = '/login?expired=1';
    }, ms);
    return () => window.clearTimeout(id);
  }, [token, logout]);

  const loginWithGoogle = async (credential: string) => {
    const { data } = await api.post<AuthResponse>('/auth/google', { credential });
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    setToken(data.token);
    return data.user;
  };

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<User>('/auth/me');
    setUser(data);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithGoogle, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
