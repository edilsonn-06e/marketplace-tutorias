import { useEffect, useState, type FormEvent } from 'react';
import { getReports, resolveReport } from '../../api/admin';
import { getErrorMessage } from '../../api/client';
import { Loader } from '../ui/Loader';
import { Modal } from '../ui/Modal';
import { UserHistoryModal } from './UserHistoryModal';
import { formatDate, REPORT_REASON_LABEL } from '../../utils/format';
import type { ReportStatus } from '../../types/api';
import type { AdminReport } from '../../types/admin';
import styles from './Admin.module.scss';

const STATUS_LABEL: Record<ReportStatus, string> = { OPEN: 'Abierta', RESOLVED: 'Resuelta', DISMISSED: 'Descartada' };

export function ReportsTab() {
  const [status, setStatus] = useState<ReportStatus | ''>('OPEN');
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [resolving, setResolving] = useState<AdminReport | null>(null);

  useEffect(() => {
    setLoading(true);
    getReports(status || undefined)
      .then(setReports)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [status]);

  const handleResolved = (id: string, newStatus: ReportStatus) => {
    setReports((prev) =>
      status === 'OPEN' ? prev.filter((r) => r.id !== id) : prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
    );
    setResolving(null);
  };

  return (
    <>
      <div className={styles.toolbar}>
        <label className="field">
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value as ReportStatus | '')}>
            <option value="OPEN">Abiertas</option>
            <option value="RESOLVED">Resueltas</option>
            <option value="DISMISSED">Descartadas</option>
            <option value="">Todas</option>
          </select>
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <Loader text="Cargando denuncias…" />
      ) : reports.length === 0 ? (
        <p className={styles.empty}>No hay denuncias en esta bandeja.</p>
      ) : (
        <div className={styles.list}>
          {reports.map((r) => (
            <article key={r.id} className={styles.item}>
              <div className={styles.itemHeader}>
                <div>
                  <strong>{REPORT_REASON_LABEL[r.reason]}</strong>
                  <p className={styles.muted}>{formatDate(r.createdAt)}</p>
                </div>
                <span className={`badge badge--${r.status}`}>{STATUS_LABEL[r.status]}</span>
              </div>
              <dl className={styles.details}>
                <dt>Denunciante</dt>
                <dd>{r.reporter.name}</dd>
                <dt>Denunciado</dt>
                <dd>
                  {r.reported.name}
                  {r.reported.status === 'SUSPENDED' && ' (suspendido)'} · {r.reported._count.reportsReceived} denuncia(s)
                </dd>
              </dl>
              <p className={styles.quote}>{r.evidence}</p>
              {r.adminNote && <p className={styles.muted}>Nota: {r.adminNote}</p>}
              <div className={styles.actions}>
                <button className="btn btn--outline" onClick={() => setHistoryId(r.reported.id)}>Ver historial</button>
                {r.status === 'OPEN' && <button className="btn" onClick={() => setResolving(r)}>Atender</button>}
              </div>
            </article>
          ))}
        </div>
      )}

      {historyId && <UserHistoryModal userId={historyId} onClose={() => setHistoryId(null)} />}
      {resolving && (
        <ResolveReportModal report={resolving} onClose={() => setResolving(null)} onResolved={handleResolved} />
      )}
    </>
  );
}

interface ResolveReportModalProps {
  report: AdminReport;
  onClose: () => void;
  onResolved: (id: string, status: ReportStatus) => void;
}

function ResolveReportModal({ report, onClose, onResolved }: ResolveReportModalProps) {
  const [note, setNote] = useState('');
  const [suspend, setSuspend] = useState(false);
  const [reason, setReason] = useState(REPORT_REASON_LABEL[report.reason]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (newStatus: 'RESOLVED' | 'DISMISSED') => {
    setBusy(true);
    setError('');
    try {
      await resolveReport(report.id, {
        status: newStatus,
        adminNote: note.trim() || undefined,
        suspendUser: newStatus === 'RESOLVED' && suspend,
        suspendReason: suspend ? reason.trim() : undefined,
      });
      onResolved(report.id, newStatus);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit('RESOLVED');
  };

  return (
    <Modal title={`Denuncia contra ${report.reported.name}`} onClose={onClose}>
      <form className={styles.card} onSubmit={handleSubmit} style={{ boxShadow: 'none', border: 0, padding: 0 }}>
        <label className="field">
          Nota del administrador (opcional)
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={3} />
        </label>
        <label className={styles.check}>
          <input type="checkbox" checked={suspend} onChange={(e) => setSuspend(e.target.checked)} />
          Suspender la cuenta de {report.reported.name}
        </label>
        {suspend && (
          <label className="field">
            Motivo de la suspensión (lo verá el usuario)
            <input value={reason} onChange={(e) => setReason(e.target.value)} minLength={5} maxLength={500} required />
          </label>
        )}
        {error && <p className="form-error">{error}</p>}
        <div className={styles.actions}>
          <button type="submit" className="btn" disabled={busy}>
            {suspend ? 'Resolver y suspender' : 'Marcar como resuelta'}
          </button>
          <button type="button" className="btn btn--outline" disabled={busy} onClick={() => submit('DISMISSED')}>
            Descartar denuncia
          </button>
        </div>
      </form>
    </Modal>
  );
}
