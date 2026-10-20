import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RequireActiveUser, RequireAuth } from './routes/guards';
import { AppLayout } from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import SuspendedPage from './pages/SuspendedPage';
import HomePage from './pages/HomePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/suspended" element={<SuspendedPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          <Route element={<RequireActiveUser />}>
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
