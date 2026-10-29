import { useEffect, useState } from 'react';
import { getPendingTutors, setTutorApproval } from '../../api/admin';
import { getErrorMessage } from '../../api/client';
import { Avatar } from '../ui/Avatar';
import { Loader } from '../ui/Loader';
import { formatDate, formatMoney } from '../../utils/format';
import type { PendingTutor } from '../../types/admin';
import styles from './Admin.module.scss';

export function PendingTutorsTab() {
  const [tutors, setTutors] = useState<PendingTutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    getPendingTutors()
      .then(setTutors)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const decide = async (id: string, approval: 'APPROVED' | 'REJECTED') => {
    setBusyId(id);
    setError('');
    try {
      await setTutorApproval(id, approval);
      setTutors((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loader text="Cargando tutores…" />;

  return (
    <>
      {error && <p className="form-error">{error}</p>}
      {tutors.length === 0 ? (
        <p className={styles.empty}>No hay tutores pendientes de aprobación.</p>
      ) : (
        <div className={styles.list}>
          {tutors.map((t) => (
            <article key={t.id} className={styles.item}>
              <div className={styles.person}>
                <Avatar name={t.name} photoUrl={t.photoUrl} size={44} />
                <div>
                  <strong>{t.name}</strong>
                  <span className={styles.muted}>{t.email} · desde {formatDate(t.createdAt)}</span>
                </div>
              </div>
              <p className={styles.quote}>{t.tutorProfile.bio}</p>
              <dl className={styles.details}>
                <dt>Tarifa base</dt>
                <dd>{formatMoney(t.tutorProfile.baseRate)}/hora</dd>
                <dt>Hoja de vida</dt>
                <dd><a href={t.tutorProfile.cvUrl} target="_blank" rel="noreferrer">Abrir enlace</a></dd>
              </dl>
              <div className={styles.tags}>
                {t.categories.map(({ category }) => (
                  <span key={category.id} className="tag">{category.name}</span>
                ))}
              </div>
              <div className={styles.actions}>
                <button className="btn" disabled={busyId === t.id} onClick={() => decide(t.id, 'APPROVED')}>Aprobar</button>
                <button className="btn btn--danger" disabled={busyId === t.id} onClick={() => decide(t.id, 'REJECTED')}>
                  Rechazar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
