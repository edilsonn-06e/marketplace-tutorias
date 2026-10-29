import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RequireActiveUser, RequireAuth, RequireRole } from './routes/guards';
import { AppLayout } from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import SuspendedPage from './pages/SuspendedPage';
import HomePage from './pages/HomePage';
import PoliciesPage from './pages/PoliciesPage';
import SearchPage from './pages/SearchPage';
import TutorProfilePage from './pages/TutorProfilePage';
import HirePage from './pages/HirePage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import OffersPage from './pages/OffersPage';
import AvailabilityPage from './pages/AvailabilityPage';
import CalendarPage from './pages/CalendarPage';
import ChatPage from './pages/ChatPage';
import ReportsPage from './pages/ReportsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminModerationPage from './pages/admin/AdminModerationPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/policies" element={<PoliciesPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/suspended" element={<SuspendedPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          <Route element={<RequireActiveUser />}>
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/tutors/:id" element={<TutorProfilePage />} />

              <Route element={<RequireRole roles={['STUDENT']} />}>
                <Route path="/hire/:tutorId/:offerId" element={<HirePage />} />
              </Route>

              <Route element={<RequireRole roles={['STUDENT', 'TUTOR']} />}>
                <Route path="/subscriptions" element={<SubscriptionsPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/chat/:conversationId" element={<ChatPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>

              <Route element={<RequireRole roles={['TUTOR']} />}>
                <Route path="/tutor/offers" element={<OffersPage />} />
                <Route path="/tutor/availability" element={<AvailabilityPage />} />
              </Route>

              <Route element={<RequireRole roles={['ADMIN']} />}>
                <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                <Route path="/admin/moderation" element={<AdminModerationPage />} />
                <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}