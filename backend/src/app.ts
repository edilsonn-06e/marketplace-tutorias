import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { requireAuth, blockSuspended, requireOnboarded } from './middlewares/auth';
import { requireRole } from './middlewares/roles';
import authRoutes from './modules/auth/auth.routes';
// Descomenta cada import (y su línea api.use / app4.use de abajo) cuando crees el módulo:
import usersRoutes from './modules/users/users.routes';
import categoriesRoutes from './modules/categories/categories.routes';
// import appealsRoutes from './modules/appeals/appeals.routes';
import tutorsRoutes from './modules/tutors/tutors.routes';
import offersRoutes from './modules/offers/offers.routes';
import availabilityRoutes from './modules/availability/availability.routes';
import quotesRoutes from './modules/quotes/quotes.routes';
import subscriptionsRoutes from './modules/subscriptions/subscriptions.routes';
// import sessionsRoutes from './modules/sessions/sessions.routes';
// import reviewsRoutes from './modules/reviews/reviews.routes';
// import chatRoutes from './modules/chat/chat.routes';
// import reportsRoutes from './modules/reports/reports.routes';
// import adminRoutes from './modules/admin/admin.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URLS }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

const api = Router();

// 1) Públicas (sin JWT)
api.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});
api.use('/auth', authRoutes); // /auth/google es pública; /auth/me exige JWT adentro

// 2) Con JWT, permitidas aunque la cuenta esté SUSPENDIDA
// api.use('/appeals', requireAuth, appealsRoutes);

// 3) Con JWT, cuenta activa, aunque NO haya terminado onboarding
api.use('/users', requireAuth, blockSuspended, usersRoutes);
api.use('/categories', requireAuth, blockSuspended, categoriesRoutes);

// 4) Con JWT, cuenta activa y onboarding completo
const app4 = Router();
app4.use(requireAuth, blockSuspended, requireOnboarded);
app4.use('/tutors', tutorsRoutes);
app4.use('/offers', offersRoutes);
app4.use('/availability', availabilityRoutes);
app4.use('/quotes', quotesRoutes);
app4.use('/subscriptions', subscriptionsRoutes);
// app4.use('/sessions', sessionsRoutes);
// app4.use('/reviews', reviewsRoutes);
// app4.use('/conversations', chatRoutes);
// app4.use('/reports', reportsRoutes);
app4.use('/admin', requireRole('ADMIN') /* , adminRoutes */);
api.use(app4);

app.use('/api', api);

// 404 para cualquier ruta no definida
app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` } });
});

app.use(errorHandler); // SIEMPRE al final

export default app;
