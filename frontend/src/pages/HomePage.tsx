import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { NAV_ITEMS } from '../components/layout/NavItems';
import { ROLE_LABEL } from '../utils/format';
import styles from './HomePage.module.scss';

export default function HomePage() {
  const { user } = useAuth();
  if (!user?.role) return null;

  const shortcuts = NAV_ITEMS[user.role].filter((item) => item.to !== '/');
  const approval = user.tutorProfile?.approval;
  const firstName = user.name.split(' ')[0];

  return (
    <div className={styles.page}>
      <section className={styles.welcome}>
        <Avatar name={user.name} photoUrl={user.photoUrl} size={64} />
        <div>
          <h1>¡Hola, {firstName}!</h1>
          <span className="badge badge--APPROVED">{ROLE_LABEL[user.role]}</span>
        </div>
      </section>

      {user.role === 'TUTOR' && approval === 'PENDING' && (
        <p className={styles.notice}>
          Tu perfil de tutor está en revisión. Podrás publicar ofertas cuando un administrador lo apruebe.
        </p>
      )}
      {user.role === 'TUTOR' && approval === 'REJECTED' && (
        <p className={`${styles.notice} ${styles.rejected}`}>
          Tu perfil de tutor fue rechazado. Revisa tus datos o contacta a un administrador.
        </p>
      )}

      <div className={styles.shortcuts}>
        {shortcuts.map((item) => (
          <Link key={item.to} to={item.to} className={styles.shortcut}>
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}