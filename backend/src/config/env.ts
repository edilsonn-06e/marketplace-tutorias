import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

const list = (value: string | undefined) =>
  (value ?? '').split(',').map((s) => s.trim()).filter(Boolean);

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '8h',
  GOOGLE_CLIENT_ID: required('GOOGLE_CLIENT_ID'),
  FRONTEND_URLS: list(process.env.FRONTEND_URL ?? 'http://localhost:5173'),
  ADMIN_EMAILS: list(process.env.ADMIN_EMAILS).map((e) => e.toLowerCase()),
  TIMEZONE_OFFSET: process.env.TIMEZONE_OFFSET ?? '-06:00',
  ENABLE_DEV_LOGIN: process.env.ENABLE_DEV_LOGIN === 'true',
  ALLOW_EARLY_COMPLETE: process.env.ALLOW_EARLY_COMPLETE === 'true',
};