import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './StatusPage.module.scss';

export default function OnboardingPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <h1>Completa tu perfil</h1>
        <p>Hola {user?.name}, antes de usar la plataforma debes completar tus datos.</p>
        <p className={styles.muted}>Formulario de onboarding pendiente.</p>
        <button className="btn btn--outline" onClick={() => { logout(); navigate('/login'); }}>Salir</button>
      </section>
    </div>
  );
}
