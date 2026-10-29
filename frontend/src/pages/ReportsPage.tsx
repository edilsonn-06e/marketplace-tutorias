import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { createReport, getMyReports, type MyReport } from '../api/reports';
import { getMySubscriptions } from '../api/subscriptions';
import { getConversations } from '../api/chat';
import { getErrorMessage } from '../api/client';
import { Loader } from '../components/ui/Loader';
import { formatDate, REPORT_REASON_LABEL } from '../utils/format';
import type { ReportReason, ReportStatus, UserSummary } from '../types/api';
import styles from './ReportsPage.module.scss';

const STATUS_LABEL: Record<ReportStatus, string> = {
  OPEN: 'En revisión',
  RESOLVED: 'Resuelta',
  DISMISSED: 'Descartada',
};

const REASONS = Object.keys(REPORT_REASON_LABEL) as ReportReason[];
const MIN_EVIDENCE = 10;

export default function ReportsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<UserSummary[]>([]);
  const [reports, setReports] = useState<MyReport[]>([]);
  const [reportedUserId, setReportedUserId] = useState('');
  const [reason, setReason] = useState<ReportReason>('NO_SHOW');
  const [evidence, setEvidence] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([getMyReports(), getMySubscriptions(), getConversations()])
      .then(([myReports, subs, conversations]) => {
        setReports(myReports);
        const people = [
          ...subs.map((s) => (s.studentId === user?.id ? s.tutor : s.student)),
          ...conversations.map((c) => c.otherUser),
        ];
        const unique = new Map(people.map((p) => [p.id, { id: p.id, name: p.name, photoUrl: p.photoUrl }]));
        setContacts([...unique.values()].sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setError('');
    setSuccess('');
    try {
      await createReport({ reportedUserId, reason, evidence: evidence.trim() });
      setReports(await getMyReports());
      setReportedUserId('');
      setEvidence('');
      setSuccess('Denuncia enviada. Un administrador la revisará.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Loader text="Cargando…" />;

  return (
    <div className={styles.page}>
      <h1>Denuncias</h1>

      <div className={styles.layout}>
        <form className={styles.card} onSubmit={handleSubmit}>
          <h2>Nueva denuncia</h2>
          <p className={styles.muted}>
            Puedes denunciar a personas con las que tuviste una contratación o una conversación.
          </p>

          {contacts.length === 0 ? (
            <p className={styles.muted}>Todavía no tienes contactos en la plataforma.</p>
          ) : (
            <>
              <label className="field">
                ¿A quién denuncias?
                <select value={reportedUserId} onChange={(e) => setReportedUserId(e.target.value)} required>
                  <option value="" disabled>Elige una persona</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                Motivo
                <select value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
                  {REASONS.map((r) => (
                    <option key={r} value={r}>{REPORT_REASON_LABEL[r]}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                Evidencia
                <textarea
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  minLength={MIN_EVIDENCE}
                  maxLength={2000}
                  rows={5}
                  placeholder="Describe qué pasó, cuándo y cualquier detalle que ayude al administrador."
                  required
                />
                <small>{evidence.trim().length}/{MIN_EVIDENCE} caracteres mínimos</small>
              </label>

              {error && <p className="form-error">{error}</p>}
              {success && <p className={styles.success}>{success}</p>}

              <button type="submit" className="btn btn--danger" disabled={sending}>
                {sending ? 'Enviando…' : 'Enviar denuncia'}
              </button>
            </>
          )}
        </form>

        <section className={styles.card}>
          <h2>Mis denuncias</h2>
          {reports.length === 0 ? (
            <p className={styles.muted}>No has enviado denuncias.</p>
          ) : (
            <ul className={styles.list}>
              {reports.map((r) => (
                <li key={r.id} className={styles.item}>
                  <div className={styles.itemHeader}>
                    <strong>{r.reported.name}</strong>
                    <span className={`badge badge--${r.status}`}>{STATUS_LABEL[r.status]}</span>
                  </div>
                  <span className={styles.muted}>
                    {REPORT_REASON_LABEL[r.reason]} · {formatDate(r.createdAt)}
                  </span>
                  <p>{r.evidence}</p>
                  {r.adminNote && (
                    <p className={styles.note}>
                      <strong>Respuesta del administrador:</strong> {r.adminNote}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
