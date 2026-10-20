import axios, { AxiosError } from 'axios';
import type { ApiErrorBody } from '../types/api';

export const TOKEN_KEY = 'tutorias_token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 70_000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status;
    const code = error.response?.data?.error?.code;
    const path = window.location.pathname;

    if (status === 401 && path !== '/login') {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login?expired=1';
    } else if (code === 'ACCOUNT_SUSPENDED' && path !== '/suspended') {
      window.location.href = '/suspended';
    } else if (code === 'ONBOARDING_REQUIRED' && path !== '/onboarding') {
      window.location.href = '/onboarding';
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(err)) {
    return err.response?.data?.error?.message ?? 'No se pudo conectar con el servidor';
  }
  return 'Error inesperado';
}

export function getErrorCode(err: unknown): string | undefined {
  return axios.isAxiosError<ApiErrorBody>(err) ? err.response?.data?.error?.code : undefined;
}
