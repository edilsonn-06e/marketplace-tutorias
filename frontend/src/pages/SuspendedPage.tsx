import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createAppeal, getMyAppeals } from '../api/appeals';
import { getErrorMessage } from '../api/client';
import type { Appeal, AppealStatus } from '../types/api';
import styles from './SuspendedPage.module.scss';

const APPEAL_LABEL: Record<AppealStatus, string> = {
  PENDING: 'En revisión',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
};

const MIN_LENGTH = 20;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('es-GT', { dateStyle: 'long', timeStyle: 'short' });

export default function SuspendedPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    getMyAppeals()
      .then(setAppeals)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (user && user.status !== 'SUSPENDED') return <Navigate to="/" replace />;

  const hasPending = appeals.some((a) => a.status === 'PENDING');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const created = await createAppeal(message.trim());
      setAppeals((prev) => [created, ...prev]);
      setMessage('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const checkStatus = async () => {
    setChecking(true);
    try {
      await refreshUser();
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={`card ${styles.notice}`}>
          <h1>Tu cuenta está suspendida</h1>
          <dl className={styles.details}>
            <dt>Motivo</dt>
            <dd>{user?.suspendedReason ?? 'No especificado'}</dd>
            <dt>Fecha</dt>
            <dd>{user?.suspendedAt ? formatDate(user.suspendedAt) : '—'}</dd>
          </dl>
          <p>
            Mientras tu cuenta esté suspendida no puedes usar la plataforma. Revisa nuestras{' '}
            <Link to="/policies">políticas de convivencia</Link> y, si crees que es un error, envía una apelación.
          </p>
          <div className={styles.actions}>
            <button className="btn btn--outline" onClick={checkStatus} disabled={checking}>
              {checking ? 'Revisando…' : 'Revisar estado'}
            </button>
            <button className="btn btn--outline" onClick={() => { logout(); navigate('/login'); }}>
              Salir
            </button>
          </div>
        </section>

        <section className="card">
          <h2>Apelación</h2>
          {hasPending ? (
            <p className={styles.muted}>
              Ya tienes una apelación en revisión. Te avisaremos cuando el administrador responda.
            </p>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <label className="field">
                Explica tu caso
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  minLength={MIN_LENGTH}
                  maxLength={3000}
                  rows={6}
                  required
                />
                <small>{message.trim().length}/{MIN_LENGTH} caracteres mínimos</small>
              </label>
              {error && <p className="form-error">{error}</p>}
              <button type="submit" className="btn" disabled={sending || message.trim().length < MIN_LENGTH}>
                {sending ? 'Enviando…' : 'Enviar apelación'}
              </button>
            </form>
          )}
        </section>

        {appeals.length > 0 && (
          <section className="card">
            <h2>Mis apelaciones</h2>
            <ul className={styles.list}>
              {appeals.map((a) => (
                <li key={a.id} className={styles.item}>
                  <div className={styles.itemHeader}>
                    <span className={`badge badge--${a.status}`}>{APPEAL_LABEL[a.status]}</span>
                    <small className={styles.muted}>{formatDate(a.createdAt)}</small>
                  </div>
                  <p>{a.message}</p>
                  {a.adminResponse && (
                    <p className={styles.response}>
                      <strong>Respuesta del administrador:</strong> {a.adminResponse}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}