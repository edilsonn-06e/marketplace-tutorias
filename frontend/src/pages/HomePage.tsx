import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/api';
import styles from './StatusPage.module.scss';

const ROLE_LABEL: Record<Role, string> = {
  STUDENT: 'Estudiante',
  TUTOR: 'Tutor',
  ADMIN: 'Administrador',
};

export default function HomePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <section className={styles.panel}>
      {user.photoUrl && <img className={styles.avatar} src={user.photoUrl} alt="" referrerPolicy="no-referrer" />}
      <h1>¡Hola, {user.name}!</h1>
      <p className={styles.muted}>{user.email}</p>
      {user.role && <span className="badge badge--APPROVED">{ROLE_LABEL[user.role]}</span>}
      <p>Iniciaste sesión correctamente.</p>
    </section>
  );
}
