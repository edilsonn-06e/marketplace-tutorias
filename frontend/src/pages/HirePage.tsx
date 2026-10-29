import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getTutorProfile } from '../api/tutors';
import { createSubscription, getQuote, type QuoteInput } from '../api/subscriptions';
import { getErrorMessage } from '../api/client';
import { Loader } from '../components/ui/Loader';
import { RouteMap } from '../components/map/RouteMap';
import { DAY_NAMES, formatMoney, MODALITY_LABEL, WEEK_ORDER } from '../utils/format';
import type { Modality, Quote, TutorPublicProfile } from '../types/api';
import styles from './HirePage.module.scss';

interface HireForm {
  modality: Modality;
  startDate: string;
  startTime: string;
  durationMinutes: number;
  weeks: number;
  daysOfWeek: number[];
  notes: string;
}

const INITIAL_FORM: HireForm = {
  modality: 'VIRTUAL',
  startDate: '',
  startTime: '',
  durationMinutes: 60,
  weeks: 4,
  daysOfWeek: [],
  notes: '',
};

const DURATIONS = [60, 90, 120];
const WEEK_PLANS = [4, 8, 12];

const tomorrow = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-CA');

export default function HirePage() {
  const { tutorId, offerId } = useParams<{ tutorId: string; offerId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<TutorPublicProfile | null>(null);
  const [form, setForm] = useState<HireForm>(INITIAL_FORM);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'quote' | 'confirm' | null>(null);

  useEffect(() => {
    if (!tutorId) return;
    getTutorProfile(tutorId)
      .then((p) => {
        setProfile(p);
        const found = p.offers.find((o) => o.id === offerId);
        if (found) setForm((prev) => ({ ...prev, modality: found.modalities[0] }));
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [tutorId, offerId]);

  if (!profile) {
    return error ? <p className="form-error">{error}</p> : <Loader text="Cargando oferta…" />;
  }

  const offer = profile.offers.find((o) => o.id === offerId);
  if (!offer) return <p className="form-error">Esta oferta ya no está disponible.</p>;

  const update = <K extends keyof HireForm>(field: K, value: HireForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setQuote(null);
  };

  const toggleDay = (day: number) => {
    const days = form.daysOfWeek.includes(day)
      ? form.daysOfWeek.filter((d) => d !== day)
      : [...form.daysOfWeek, day].sort((a, b) => a - b);
    update('daysOfWeek', days);
  };

  const quoteInput: QuoteInput = {
    offerId: offer.id,
    modality: form.modality,
    weeks: form.weeks,
    daysOfWeek: form.daysOfWeek,
    durationMinutes: form.durationMinutes,
  };

  const handleQuote = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.daysOfWeek.length === 0) {
      setError('Elige al menos un día de la semana');
      return;
    }
    setBusy('quote');
    setError('');
    try {
      setQuote(await getQuote(quoteInput));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleConfirm = async () => {
    setBusy('confirm');
    setError('');
    try {
      await createSubscription({
        ...quoteInput,
        startDate: form.startDate,
        startTime: form.startTime,
        notes: form.notes.trim() || undefined,
      });
      navigate('/subscriptions');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const schedule = WEEK_ORDER.map((day) => ({
    day,
    slots: profile.availability.filter((a) => a.dayOfWeek === day),
  })).filter((d) => d.slots.length > 0);

  return (
    <div className={styles.page}>
      <Link to={`/tutors/${profile.id}`} className={styles.back}>← Volver al perfil</Link>
      <h1>Contratar: {offer.title}</h1>
      <p className={styles.muted}>
        con {profile.name} · {formatMoney(offer.hourlyRate)}/hora
        {offer.perKmRate > 0 && ` · ${formatMoney(offer.perKmRate)}/km a domicilio`}
      </p>

      <div className={styles.layout}>
        <form className={styles.card} onSubmit={handleQuote}>
          <h2>Plan de clases</h2>

          <label className="field">
            Modalidad
            <select value={form.modality} onChange={(e) => update('modality', e.target.value as Modality)}>
              {offer.modalities.map((m) => (
                <option key={m} value={m}>{MODALITY_LABEL[m]}</option>
              ))}
            </select>
          </label>

          <fieldset className={styles.days}>
            <legend>Días de clase</legend>
            <div className={styles.chips}>
              {WEEK_ORDER.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`${styles.chip} ${form.daysOfWeek.includes(day) ? styles.active : ''}`}
                  onClick={() => toggleDay(day)}
                  aria-pressed={form.daysOfWeek.includes(day)}
                >
                  {DAY_NAMES[day].slice(0, 3)}
                </button>
              ))}
            </div>
          </fieldset>

          <div className={styles.grid}>
            <label className="field">
              Fecha de inicio
              <input
                type="date"
                min={tomorrow()}
                value={form.startDate}
                onChange={(e) => update('startDate', e.target.value)}
                required
              />
            </label>
            <label className="field">
              Hora de inicio
              <input
                type="time"
                step={1800}
                value={form.startTime}
                onChange={(e) => update('startTime', e.target.value)}
                required
              />
            </label>
            <label className="field">
              Duración por sesión
              <select value={form.durationMinutes} onChange={(e) => update('durationMinutes', Number(e.target.value))}>
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d / 60} {d === 60 ? 'hora' : 'horas'}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Duración del plan
              <select value={form.weeks} onChange={(e) => update('weeks', Number(e.target.value))}>
                {WEEK_PLANS.map((w) => (
                  <option key={w} value={w}>{w} semanas</option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            Notas para el tutor (opcional)
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              maxLength={500}
              rows={3}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn" disabled={busy !== null}>
            {busy === 'quote' ? 'Calculando…' : 'Calcular presupuesto'}
          </button>
        </form>

        <aside className={styles.card}>
          <h2>Horario del tutor</h2>
          {schedule.length === 0 ? (
            <p className={styles.muted}>El tutor no ha publicado su disponibilidad.</p>
          ) : (
            <ul className={styles.schedule}>
              {schedule.map(({ day, slots }) => (
                <li key={day}>
                  <strong>{DAY_NAMES[day]}</strong>
                  <span>{slots.map((s) => `${s.startTime}–${s.endTime}`).join(', ')}</span>
                </li>
              ))}
            </ul>
          )}
          <p className={styles.muted}>Tus clases deben quedar dentro de este horario.</p>
        </aside>
      </div>

      {quote && (
        <section className={`${styles.card} ${styles.quote}`}>
          <h2>Presupuesto</h2>

          <div className={styles.quoteLayout}>
            <dl className={styles.breakdown}>
              <dt>Sesiones</dt>
              <dd>{quote.sessionsCount} ({quote.weeks} semanas × {quote.daysOfWeek.length} días)</dd>

              <dt>Clase por sesión</dt>
              <dd>{formatMoney(quote.classCostPerSession)} ({quote.hoursPerSession} h × {formatMoney(quote.offer.hourlyRate)})</dd>

              {quote.distanceKm !== null && (
                <>
                  <dt>Distancia</dt>
                  <dd>
                    {quote.distanceKm} km
                    {quote.route?.durationMin != null && ` · ${quote.route.durationMin} min en carro`}
                    {quote.route?.source === 'estimate' && ' (estimada)'}
                  </dd>
                </>
              )}

              {quote.modality === 'STUDENT_HOME' && (
                <>
                  <dt>Traslado por sesión</dt>
                  <dd>
                    {formatMoney(quote.travelCostPerSession)} ({quote.roundTripKm} km ida y vuelta × {formatMoney(quote.offer.perKmRate)})
                  </dd>
                </>
              )}

              <dt>Costo por sesión</dt>
              <dd>{formatMoney(quote.costPerSession)}</dd>

              <dt className={styles.total}>Total</dt>
              <dd className={styles.total}>{formatMoney(quote.totalCost)}</dd>
            </dl>

            {quote.route && (
              <RouteMap
                from={quote.route.from}
                to={quote.route.to}
                path={quote.route.geometry}
                fromLabel={profile.name.split(' ')[0]}
              />
            )}
          </div>

          <button className="btn" onClick={handleConfirm} disabled={busy !== null}>
            {busy === 'confirm' ? 'Enviando solicitud…' : 'Confirmar contratación'}
          </button>
        </section>
      )}
    </div>
  );
}
