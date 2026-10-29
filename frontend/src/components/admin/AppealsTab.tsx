import { useEffect, useState } from 'react';
import { getAppeals, resolveAppeal } from '../../api/admin';
import { getErrorMessage } from '../../api/client';
import { Avatar } from '../ui/Avatar';
import { Loader } from '../ui/Loader';
import { UserHistoryModal } from './UserHistoryModal';
import { formatDate } from '../../utils/format';
import type { AppealStatus } from '../../types/api';
import type { AdminAppeal } from '../../types/admin';
import styles from './Admin.module.scss';

const STATUS_LABEL: Record<AppealStatus, string> = { PENDING: 'Pendiente', ACCEPTED: 'Aceptada', REJECTED: 'Rechazada' };

export function AppealsTab() {
  const [status, setStatus] = useState<AppealStatus | ''>('PENDING');
  const [appeals, setAppeals] = useState<AdminAppeal[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getAppeals(status || undefined)
      .then(setAppeals)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [status]);

  const decide = async (appeal: AdminAppeal, decision: 'ACCEPTED' | 'REJECTED') => {
    setBusyId(appeal.id);
    setError('');
    try {
      await resolveAppeal(appeal.id, decision, responses[appeal.id]?.trim() || undefined);
      setAppeals((prev) =>
        status === 'PENDING'
          ? prev.filter((a) => a.id !== appeal.id)
          : prev.map((a) => (a.id === appeal.id ? { ...a, status: decision } : a)),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className={styles.toolbar}>
        <label className="field">
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value as AppealStatus | '')}>
            <option value="PENDING">Pendientes</option>
            <option value="ACCEPTED">Aceptadas</option>
            <option value="REJECTED">Rechazadas</option>
            <option value="">Todas</option>
          </select>
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <Loader text="Cargando apelaciones…" />
      ) : appeals.length === 0 ? (
        <p className={styles.empty}>No hay apelaciones en esta bandeja.</p>
      ) : (
        <div className={styles.list}>
          {appeals.map((a) => (
            <article key={a.id} className={styles.item}>
              <div className={styles.itemHeader}>
                <div className={styles.person}>
                  <Avatar name={a.user.name} photoUrl={a.user.photoUrl} size={40} />
                  <div>
                    <strong>{a.user.name}</strong>
                    <span className={styles.muted}>{a.user.email}</span>
                  </div>
                </div>
                <span className={`badge badge--${a.status}`}>{STATUS_LABEL[a.status]}</span>
              </div>
              {a.user.suspendedReason && (
                <p className={styles.muted}>
                  Suspendido por: {a.user.suspendedReason}
                  {a.user.suspendedAt && ` (${formatDate(a.user.suspendedAt)})`}
                </p>
              )}
              <p className={styles.quote}>{a.message}</p>
              {a.status === 'PENDING' ? (
                <>
                  <label className="field">
                    Respuesta al usuario (opcional)
                    <textarea
                      value={responses[a.id] ?? ''}
                      onChange={(e) => setResponses((prev) => ({ ...prev, [a.id]: e.target.value }))}
                      maxLength={1000}
                      rows={2}
                    />
                  </label>
                  <div className={styles.actions}>
                    <button className="btn" disabled={busyId === a.id} onClick={() => decide(a, 'ACCEPTED')}>
                      Aceptar y reactivar
                    </button>
                    <button className="btn btn--danger" disabled={busyId === a.id} onClick={() => decide(a, 'REJECTED')}>
                      Rechazar
                    </button>
                    <button className="btn btn--outline" onClick={() => setHistoryId(a.user.id)}>Ver historial</button>
                  </div>
                </>
              ) : (
                a.adminResponse && <p className={styles.muted}>Respuesta: {a.adminResponse}</p>
              )}
            </article>
          ))}
        </div>
      )}

      {historyId && <UserHistoryModal userId={historyId} onClose={() => setHistoryId(null)} />}
    </>
  );
}
