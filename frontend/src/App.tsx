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
import ComingSoonPage from './pages/CoomingSoonPage';

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

              <Route element={<RequireRole roles={['STUDENT', 'TUTOR']} />}>
                <Route path="/subscriptions" element={<ComingSoonPage />} />
                <Route path="/calendar" element={<ComingSoonPage />} />
                <Route path="/chat" element={<ComingSoonPage />} />
                <Route path="/reports" element={<ComingSoonPage />} />
              </Route>

              <Route element={<RequireRole roles={['TUTOR']} />}>
                <Route path="/tutor/offers" element={<ComingSoonPage />} />
                <Route path="/tutor/availability" element={<ComingSoonPage />} />
              </Route>

              <Route element={<RequireRole roles={['ADMIN']} />}>
                <Route path="/admin/categories" element={<ComingSoonPage />} />
                <Route path="/admin/moderation" element={<ComingSoonPage />} />
                <Route path="/admin/analytics" element={<ComingSoonPage />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}