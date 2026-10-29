import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { ROLE_LABEL } from '../../utils/format';
import { NAV_ITEMS } from './NavItems';
import styles from './Navbar.module.scss';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const items = user?.role ? NAV_ITEMS[user.role] : [];
  const closeMenu = () => setOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand} onClick={closeMenu}>TutoríasGT</NavLink>

        <button
          type="button"
          className={styles.toggle}
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls="main-menu"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        >
          <span />
          <span />
          <span />
        </button>

        <nav id="main-menu" className={`${styles.menu} ${open ? styles.open : ''}`}>
          <ul className={styles.links}>
            {items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                  onClick={closeMenu}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {user && (
            <div className={styles.user}>
              <Avatar name={user.name} photoUrl={user.photoUrl} size={32} />
              <div className={styles.userInfo}>
                <span className={styles.name}>{user.name}</span>
                {user.role && <span className={styles.role}>{ROLE_LABEL[user.role]}</span>}
              </div>
              <button className="btn btn--outline" onClick={handleLogout}>Salir</button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}