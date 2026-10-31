import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { HttpError } from '../../utils/httpError';
import { signToken } from '../../utils/jwt';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export function getMe(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { tutorProfile: true, categories: { include: { category: true } } },
  });
}

async function buildSession(userId: string) {
  const user = await getMe(userId);
  return { token: signToken(user), user };
}

export async function loginWithGoogle(credential: string) {
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    throw new HttpError(401, 'INVALID_GOOGLE_TOKEN', 'El token de Google no es válido');
  }
  if (!payload?.sub || !payload.email || !payload.email_verified) {
    throw new HttpError(401, 'INVALID_GOOGLE_TOKEN', 'La cuenta de Google no tiene un correo verificado');
  }

  const email = payload.email.toLowerCase();
  const name = payload.name ?? email;
  const isAdmin = env.ADMIN_EMAILS.includes(email);

  const existing = await prisma.user.findFirst({
    where: { OR: [{ googleId: payload.sub }, { email }] },
    select: { id: true },
  });

  const user = await prisma.user.upsert({
    where: { id: existing?.id ?? '' },
    update: isAdmin
      ? { googleId: payload.sub, name, photoUrl: payload.picture, role: 'ADMIN', onboarded: true }
      : { googleId: payload.sub, name, photoUrl: payload.picture },
    create: {
      googleId: payload.sub,
      email,
      name,
      photoUrl: payload.picture,
      role: isAdmin ? 'ADMIN' : null,
      onboarded: isAdmin,
    },
  });

  return buildSession(user.id);
}

export async function devLogin(email: string) {
  if (!env.ENABLE_DEV_LOGIN) throw new HttpError(404, 'NOT_FOUND', 'Ruta no encontrada');
  const normalized = email.toLowerCase();
  const isAdmin = env.ADMIN_EMAILS.includes(normalized);
  const user = await prisma.user.upsert({
    where: { email: normalized },
    update: {},
    create: {
      googleId: `dev-${normalized}`,
      email: normalized,
      name: normalized.split('@')[0],
      role: isAdmin ? 'ADMIN' : null,
      onboarded: isAdmin,
    },
  });
  return buildSession(user.id);
}