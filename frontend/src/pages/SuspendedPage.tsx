import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './StatusPage.module.scss';

export default function SuspendedPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (user && user.status !== 'SUSPENDED') return <Navigate to="/" replace />;

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <h1>Tu cuenta está suspendida</h1>
        {user?.suspendedReason && <p><strong>Motivo:</strong> {user.suspendedReason}</p>}
        {user?.suspendedAt && (
          <p className={styles.muted}>Desde el {new Date(user.suspendedAt).toLocaleDateString('es-GT', { dateStyle: 'long' })}</p>
        )}
        <button className="btn btn--outline" onClick={() => { logout(); navigate('/login'); }}>Salir</button>
      </section>
    </div>
  );
}
