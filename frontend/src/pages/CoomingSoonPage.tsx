import { Link } from 'react-router-dom';
import styles from './StatusPage.module.scss';

export default function ComingSoonPage() {
  return (
    <section className={styles.panel}>
      <h1>Próximamente</h1>
      <p className={styles.muted}>Esta sección todavía está en construcción.</p>
      <Link to="/" className="btn btn--outline">Volver al inicio</Link>
    </section>
  );
}