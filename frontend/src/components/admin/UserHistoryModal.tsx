import { useEffect, useState } from 'react';
import { getUserDetail } from '../../api/admin';
import { getErrorMessage } from '../../api/client';
import { Modal } from '../ui/Modal';
import { Loader } from '../ui/Loader';
import { formatDate, REPORT_REASON_LABEL, ROLE_LABEL } from '../../utils/format';
import type { AdminUserDetail } from '../../types/admin';
import styles from './Admin.module.scss';

interface UserHistoryModalProps {
  userId: string;
  onClose: () => void;
}

export function UserHistoryModal({ userId, onClose }: UserHistoryModalProps) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getUserDetail(userId)
      .then(setDetail)
      .catch((err) => setError(getErrorMessage(err)));
  }, [userId]);

  return (
    <Modal title={detail ? `Historial de ${detail.name}` : 'Historial'} onClose={onClose}>
      {error && <p className="form-error">{error}</p>}
      {!detail && !error && <Loader text="Cargando historial…" />}
      {detail && (
        <div className={styles.history}>
          <dl className={styles.details}>
            <dt>Correo</dt>
            <dd>{detail.email}</dd>
            <dt>Rol</dt>
            <dd>{detail.role ? ROLE_LABEL[detail.role] : '—'}</dd>
            <dt>Estado</dt>
            <dd>{detail.status === 'SUSPENDED' ? `Suspendido: ${detail.suspendedReason ?? ''}` : 'Activo'}</dd>
          </dl>

          <section>
            <h3>Denuncias recibidas ({detail.reportsReceived.length})</h3>
            {detail.reportsReceived.length === 0 ? (
              <p className={styles.muted}>Ninguna.</p>
            ) : (
              <ul>
                {detail.reportsReceived.map((r) => (
                  <li key={r.id}>
                    <strong>{REPORT_REASON_LABEL[r.reason]}</strong> · por {r.reporter.name} · {formatDate(r.createdAt)}{' '}
                    <span className={`badge badge--${r.status}`}>{r.status}</span>
                    <p className={styles.muted}>{r.evidence}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3>Denuncias realizadas ({detail.reportsMade.length})</h3>
            {detail.reportsMade.length === 0 ? (
              <p className={styles.muted}>Ninguna.</p>
            ) : (
              <ul>
                {detail.reportsMade.map((r) => (
                  <li key={r.id}>
                    <strong>{REPORT_REASON_LABEL[r.reason]}</strong> · contra {r.reported.name} · {formatDate(r.createdAt)}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3>Apelaciones ({detail.appeals.length})</h3>
            {detail.appeals.length === 0 ? (
              <p className={styles.muted}>Ninguna.</p>
            ) : (
              <ul>
                {detail.appeals.map((a) => (
                  <li key={a.id}>
                    <span className={`badge badge--${a.status}`}>{a.status}</span> {formatDate(a.createdAt)}
                    <p className={styles.muted}>{a.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}
