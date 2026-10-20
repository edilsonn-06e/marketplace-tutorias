import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.scss';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand}>TutoríasGT</NavLink>
        <div className={styles.user}>
          {user?.photoUrl && <img src={user.photoUrl} alt="" referrerPolicy="no-referrer" />}
          <span className={styles.name}>{user?.name}</span>
          <button className="btn btn--outline" onClick={() => { logout(); navigate('/login'); }}>Salir</button>
        </div>
      </div>
    </header>
  );
}
