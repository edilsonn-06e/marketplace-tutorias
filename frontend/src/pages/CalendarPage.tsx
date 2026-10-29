import { useEffect, useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, Views, type Event, type View } from 'react-big-calendar';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '../context/AuthContext';
import { getMySessions } from '../api/sessions';
import { getErrorMessage } from '../api/client';
import { Loader } from '../components/ui/Loader';
import { SessionDetail } from '../components/calendar/SessionDetail';
import { SESSION_LABEL } from '../utils/format';
import type { CalendarSession, SessionStatus } from '../types/api';
import styles from './CalendarPage.module.scss';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales: { es },
});

const MESSAGES = {
  today: 'Hoy',
  previous: 'Anterior',
  next: 'Siguiente',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Clase',
  noEventsInRange: 'No hay clases en este rango',
  showMore: (count: number) => `+${count} más`,
};

const STATUSES: SessionStatus[] = ['PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED'];

interface SessionEvent extends Event {
  resource: CalendarSession;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const isTutor = user?.role === 'TUTOR';

  const [sessions, setSessions] = useState<CalendarSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>(() => (window.innerWidth < 768 ? Views.DAY : Views.WEEK));
  const [date, setDate] = useState(() => new Date());
  const [selected, setSelected] = useState<CalendarSession | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);

  useEffect(() => {
    getMySessions()
      .then(setSessions)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const events = useMemo<SessionEvent[]>(
    () =>
      sessions
        .filter((s) => showCancelled || s.status !== 'CANCELLED')
        .map((s) => ({
          title: `${s.subscription.offer.title} · ${(isTutor ? s.student : s.tutor).name}`,
          start: new Date(s.startAt),
          end: new Date(s.endAt),
          resource: s,
        })),
    [sessions, isTutor, showCancelled],
  );

  const handleChange = (updated: CalendarSession) => {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setSelected(updated);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Calendario</h1>
        <label className={styles.toggle}>
          <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />
          Mostrar canceladas
        </label>
      </header>

      <div className={styles.legend}>
        {STATUSES.map((status) => (
          <span key={status} className={styles.legendItem}>
            <span className={`${styles.dot} ${styles[status]}`} />
            {SESSION_LABEL[status]}
          </span>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <Loader text="Cargando tus clases…" />
      ) : (
        <div className={styles.calendar}>
          <Calendar<SessionEvent>
            localizer={localizer}
            culture="es"
            messages={MESSAGES}
            events={events}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            min={new Date(1970, 0, 1, 6)}
            max={new Date(1970, 0, 1, 22)}
            popup
            onSelectEvent={(event) => setSelected(event.resource)}
            eventPropGetter={(event) => ({ className: styles[event.resource.status] })}
          />
        </div>
      )}

      {selected && (
        <SessionDetail
          session={selected}
          isTutor={isTutor}
          onChange={handleChange}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
