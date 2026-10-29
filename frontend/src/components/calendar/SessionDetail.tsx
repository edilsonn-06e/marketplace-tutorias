import { useState, type FormEvent } from 'react';
import { cancelSession, completeSession } from '../../api/sessions';
import { createReview } from '../../api/reviews';
import { getErrorMessage } from '../../api/client';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { Stars } from '../ui/Stars';
import { StarInput } from '../ui/StarInput';
import { formatTime, MODALITY_LABEL, SESSION_LABEL } from '../../utils/format';
import type { CalendarSession } from '../../types/api';
import styles from './SessionDetail.module.scss';

interface SessionDetailProps {
  session: CalendarSession;
  isTutor: boolean;
  onChange: (updated: CalendarSession) => void;
  onClose: () => void;
}

export function SessionDetail({ session, isTutor, onChange, onClose }: SessionDetailProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const other = isTutor ? session.student : session.tutor;
  const start = new Date(session.startAt);
  const end = new Date(session.endAt);

  const canComplete = isTutor && session.status === 'APPROVED';
  const canCancel = (session.status === 'PENDING' || session.status === 'APPROVED') && start > new Date();
  const canReview = !isTutor && session.status === 'COMPLETED' && !session.review;

  const run = async (action: () => Promise<Partial<CalendarSession>>) => {
    setBusy(true);
    setError('');
    try {
      const patch = await action();
      onChange({ ...session, ...patch });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = () =>
    run(async () => {
      await completeSession(session.id);
      return { status: 'COMPLETED' };
    });

  const handleCancel = () => {
    if (!window.confirm('¿Cancelar esta sesión?')) return;
    run(async () => {
      await cancelSession(session.id);
      return { status: 'CANCELLED' };
    });
  };

  const handleReview = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Elige de 1 a 5 estrellas');
      return;
    }
    run(async () => {
      const review = await createReview({ sessionId: session.id, rating, comment: comment.trim() });
      return { review: { id: review.id, rating: review.rating } };
    });
  };

  return (
    <Modal title={session.subscription.offer.title} onClose={onClose}>
      <div className={styles.person}>
        <Avatar name={other.name} photoUrl={other.photoUrl} size={44} />
        <div>
          <strong>{other.name}</strong>
          <span className={styles.muted}>{isTutor ? 'Estudiante' : 'Tutor'}</span>
        </div>
        <span className={`badge badge--${session.status}`}>{SESSION_LABEL[session.status]}</span>
      </div>

      <dl className={styles.details}>
        <dt>Fecha</dt>
        <dd>{start.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</dd>
        <dt>Hora</dt>
        <dd>{formatTime(start)} – {formatTime(end)}</dd>
        <dt>Modalidad</dt>
        <dd>{MODALITY_LABEL[session.subscription.modality]}</dd>
        <dt>Categoría</dt>
        <dd>{session.subscription.offer.category.name}</dd>
      </dl>

      {session.review && (
        <p className={styles.reviewed}>
          {isTutor ? 'Calificación recibida:' : 'Tu calificación:'} <Stars value={session.review.rating} />
        </p>
      )}

      {canReview && (
        <form className={styles.reviewForm} onSubmit={handleReview}>
          <h3>Califica esta clase</h3>
          <StarInput value={rating} onChange={setRating} />
          <label className="field">
            Comentario
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              minLength={5}
              maxLength={1000}
              rows={3}
              placeholder="¿Cómo fue la clase?"
              required
            />
          </label>
          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'Enviando…' : 'Enviar reseña'}
          </button>
        </form>
      )}

      {error && <p className="form-error">{error}</p>}

      {(canComplete || canCancel) && (
        <div className={styles.actions}>
          {canComplete && (
            <button className="btn" onClick={handleComplete} disabled={busy}>Marcar como cumplida</button>
          )}
          {canCancel && (
            <button className="btn btn--outline" onClick={handleCancel} disabled={busy}>Cancelar sesión</button>
          )}
        </div>
      )}
    </Modal>
  );
}
