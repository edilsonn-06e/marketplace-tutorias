import { useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import styles from './LoginPage.module.scss';

export default function LoginPage() {
  const { user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';
  if (user) return <Navigate to={from} replace />;

  const handleSuccess = async (credential?: string) => {
    if (!credential) return;
    setLoading(true);
    setError('');
    try {
      const u = await loginWithGoogle(credential);
      if (u.status === 'SUSPENDED') navigate('/suspended', { replace: true });
      else if (!u.onboarded) navigate('/onboarding', { replace: true });
      else navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>TutoríasGT</h1>
        <p>Encuentra al tutor ideal: idiomas, deportes, ciencias, tecnología y posgrado.</p>
        {params.get('expired') && <p className={styles.warning}>Tu sesión expiró. Inicia sesión de nuevo.</p>}
        <GoogleLogin
          onSuccess={(res) => handleSuccess(res.credential)}
          onError={() => setError('No se pudo iniciar sesión con Google')}
          text="continue_with"
          shape="pill"
        />
        {loading && <p className={styles.muted}>Conectando con el servidor (puede tardar hasta un minuto la primera vez)…</p>}
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
