import { useEffect, useState } from 'react';
import { getMyAvailability, saveAvailability, type SlotInput } from '../api/availability';
import { getErrorMessage } from '../api/client';
import { Loader } from '../components/ui/Loader';
import { DAY_NAMES, WEEK_ORDER } from '../utils/format';
import styles from './AvailabilityPage.module.scss';

interface SlotRow extends SlotInput {
  key: string;
}

const GRID_START = 6 * 60;
const GRID_END = 22 * 60;

const toRow = (slot: SlotInput): SlotRow => ({ key: crypto.randomUUID(), ...slot });

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const percentOfDay = (hhmm: string) => {
  const clamped = Math.min(Math.max(toMinutes(hhmm), GRID_START), GRID_END);
  return ((clamped - GRID_START) / (GRID_END - GRID_START)) * 100;
};

const WEEKDAY_TEMPLATE: SlotInput[] = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
  dayOfWeek,
  startTime: '08:00',
  endTime: '17:00',
}));

export default function AvailabilityPage() {
  const [rows, setRows] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    getMyAvailability()
      .then((slots) => setRows(slots.map(toRow)))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const changeRows = (next: (prev: SlotRow[]) => SlotRow[]) => {
    setRows(next);
    setMessage('');
  };

  const updateRow = (key: string, patch: Partial<SlotInput>) => {
    changeRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    changeRows((prev) => [...prev, toRow({ dayOfWeek: 1, startTime: '08:00', endTime: '12:00' })]);
  };

  const removeRow = (key: string) => {
    changeRows((prev) => prev.filter((r) => r.key !== key));
  };

  const applyTemplate = () => {
    if (rows.length > 0 && !window.confirm('¿Reemplazar tu horario actual por lunes a viernes de 08:00 a 17:00?')) return;
    changeRows(() => WEEKDAY_TEMPLATE.map(toRow));
  };

  const handleSave = async () => {
    if (rows.some((r) => r.startTime >= r.endTime)) {
      setError('En cada bloque la hora de inicio debe ser menor que la de fin');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = await saveAvailability(
        rows.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime })),
      );
      setRows(saved.map(toRow));
      setMessage('Horario guardado');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader text="Cargando tu horario…" />;

  return (
    <div className={styles.page}>
      <header>
        <h1>Disponibilidad semanal</h1>
        <p className={styles.muted}>
          Los estudiantes solo podrán contratar clases dentro de estos bloques.
        </p>
      </header>

      <div className={styles.layout}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Bloques de horario</h2>
            <button type="button" className="btn btn--outline" onClick={applyTemplate}>
              Lunes a viernes 8–17
            </button>
          </div>

          {rows.length === 0 && <p className={styles.muted}>No tienes bloques. Agrega uno para empezar.</p>}

          <ul className={styles.rows}>
            {rows.map((row) => (
              <li key={row.key} className={styles.row}>
                <select
                  value={row.dayOfWeek}
                  onChange={(e) => updateRow(row.key, { dayOfWeek: Number(e.target.value) })}
                  aria-label="Día"
                >
                  {WEEK_ORDER.map((d) => (
                    <option key={d} value={d}>{DAY_NAMES[d]}</option>
                  ))}
                </select>
                <input
                  type="time"
                  step={1800}
                  value={row.startTime}
                  onChange={(e) => updateRow(row.key, { startTime: e.target.value })}
                  aria-label="Hora de inicio"
                />
                <span>a</span>
                <input
                  type="time"
                  step={1800}
                  value={row.endTime}
                  onChange={(e) => updateRow(row.key, { endTime: e.target.value })}
                  aria-label="Hora de fin"
                />
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => removeRow(row.key)}
                  aria-label="Quitar bloque"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <button type="button" className="btn btn--outline" onClick={addRow}>+ Agregar bloque</button>

          {error && <p className="form-error">{error}</p>}
          {message && <p className={styles.success}>{message}</p>}

          <button type="button" className="btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar horario'}
          </button>
        </section>

        <section className={styles.card}>
          <h2>Vista de la semana</h2>
          <div className={styles.week}>
            <div className={styles.hours}>
              <span>06:00</span>
              <span>14:00</span>
              <span>22:00</span>
            </div>
            {WEEK_ORDER.map((day) => (
              <div key={day} className={styles.dayColumn}>
                <span className={styles.dayName}>{DAY_NAMES[day].slice(0, 3)}</span>
                <div className={styles.track}>
                  {rows
                    .filter((r) => r.dayOfWeek === day && r.startTime < r.endTime)
                    .map((r) => {
                      const top = percentOfDay(r.startTime);
                      const height = percentOfDay(r.endTime) - top;
                      return (
                        <div
                          key={r.key}
                          className={styles.block}
                          style={{ top: `${top}%`, height: `${height}%` }}
                          title={`${DAY_NAMES[day]} ${r.startTime}–${r.endTime}`}
                        />
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
