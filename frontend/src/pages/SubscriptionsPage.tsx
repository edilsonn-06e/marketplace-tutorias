import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { changeSubscriptionStatus, getMySubscriptions } from '../api/subscriptions';
import { startConversation } from '../api/chat';
import { getErrorMessage } from '../api/client';
import { Avatar } from '../components/ui/Avatar';
import { Loader } from '../components/ui/Loader';
import { DAY_NAMES, formatDateOnly, formatMoney, MODALITY_LABEL, WEEK_ORDER } from '../utils/format';
import type { SubscriptionListItem, SubscriptionStatus } from '../types/api';
import styles from './SubscriptionsPage.module.scss';

type Filter = 'ALL' | SubscriptionStatus;
type NewStatus = 'APPROVED' | 'REJECTED' | 'CANCELLED';

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  CANCELLED: 'Cancelada',
};

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'APPROVED', label: 'Aprobadas' },
  { value: 'REJECTED', label: 'Rechazadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
];

const daysText = (days: number[]) =>
  WEEK_ORDER.filter((d) => days.includes(d))
    .map((d) => DAY_NAMES[d].slice(0, 3))
    .join(', ');

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subs, setSubs] = useState<SubscriptionListItem[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    getMySubscriptions()
      .then(setSubs)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const isTutor = user?.role === 'TUTOR';
  const visible = filter === 'ALL' ? subs : subs.filter((s) => s.status === filter);
  const pendingCount = subs.filter((s) => s.status === 'PENDING').length;

  const changeStatus = async (id: string, status: NewStatus) => {
    if (status === 'CANCELLED' && !window.confirm('¿Seguro que quieres cancelar? Se cancelarán las clases futuras.')) {
      return;
    }
    setBusyId(id);
    setError('');
    try {
      await changeSubscriptionStatus(id, status);
      setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const openChat = async (userId: string) => {
    try {
      const conversation = await startConversation(userId);
      navigate(`/chat/${conversation.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className={styles.page}>
      <header>
        <h1>{isTutor ? 'Solicitudes de tutoría' : 'Mis contrataciones'}</h1>
        {isTutor && pendingCount > 0 && (
          <p className={styles.muted}>Tienes {pendingCount} solicitud(es) pendiente(s) de respuesta.</p>
        )}
      </header>

      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`${styles.filter} ${filter === f.value ? styles.active : ''}`}
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <Loader text="Cargando…" />
      ) : visible.length === 0 ? (
        <p className={styles.empty}>
          No hay contrataciones en esta lista.{' '}
          {!isTutor && <Link to="/search">Busca un tutor</Link>}
        </p>
      ) : (
        <div className={styles.list}>
          {visible.map((s) => {
            const other = isTutor ? s.student : s.tutor;
            const busy = busyId === s.id;
            const canCancel = s.status === 'PENDING' || s.status === 'APPROVED';

            return (
              <article key={s.id} className={styles.item}>
                <header className={styles.itemHeader}>
                  <div className={styles.person}>
                    <Avatar name={other.name} photoUrl={other.photoUrl} size={40} />
                    <div>
                      <strong>{other.name}</strong>
                      <span className={styles.muted}>{isTutor ? 'Estudiante' : 'Tutor'}</span>
                    </div>
                  </div>
                  <span className={`badge badge--${s.status}`}>{STATUS_LABEL[s.status]}</span>
                </header>

                <h3>
                  {s.offer.title} <span className={styles.muted}>· {s.offer.category.name}</span>
                </h3>

                <dl className={styles.details}>
                  <dt>Modalidad</dt>
                  <dd>{MODALITY_LABEL[s.modality]}</dd>
                  <dt>Horario</dt>
                  <dd>{daysText(s.daysOfWeek)} · {s.startTime} ({s.durationMinutes} min)</dd>
                  <dt>Plan</dt>
                  <dd>
                    {s.weeks} semanas desde {formatDateOnly(s.startDate)} · {s._count.sessions} sesiones
                  </dd>
                  {s.distanceKm !== null && (
                    <>
                      <dt>Distancia</dt>
                      <dd>{s.distanceKm} km</dd>
                    </>
                  )}
                  <dt>Total</dt>
                  <dd><strong>{formatMoney(s.totalCost)}</strong></dd>
                </dl>

                {s.notes && <p className={styles.notes}>“{s.notes}”</p>}

                <div className={styles.actions}>
                    {isTutor && s.status === 'PENDING' && (
                      <>
                        <button className="btn" disabled={busy} onClick={() => changeStatus(s.id, 'APPROVED')}>
                          Aprobar
                        </button>
                        <button className="btn btn--danger" disabled={busy} onClick={() => changeStatus(s.id, 'REJECTED')}>
                          Rechazar
                        </button>
                      </>
                    )}
                    {canCancel && (
                      <button className="btn btn--outline" disabled={busy} onClick={() => changeStatus(s.id, 'CANCELLED')}>
                        Cancelar
                      </button>
                    )}
                    <button className="btn btn--outline" onClick={() => openChat(other.id)}>
                      Mensaje
                    </button>
                  </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
