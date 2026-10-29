import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getDemand, getMonthStats, getRanking } from '../../api/admin';
import { getErrorMessage } from '../../api/client';
import { Avatar } from '../../components/ui/Avatar';
import { Loader } from '../../components/ui/Loader';
import { Stars } from '../../components/ui/Stars';
import type { DemandRow, MonthStats, RankingEntry } from '../../types/admin';
import styles from './AdminAnalyticsPage.module.scss';

// Colores de las gráficas (validados para daltonismo). Recharts dibuja en SVG con JS,
// por eso no puede leer las variables de SASS y los repetimos aquí.
const CHART = {
  primary: '#4f46e5',
  cancelled: '#e8590c',
  grid: '#e2e8f0',
  axis: '#64748b',
  surface: '#ffffff',
};

const currentMonth = () => new Date().toLocaleDateString('en-CA').slice(0, 7);

function RankingList({ title, entries }: { title: string; entries: RankingEntry[] }) {
  return (
    <section className={styles.card}>
      <h2>{title}</h2>
      {entries.length === 0 ? (
        <p className={styles.muted}>Aún no hay tutores con reseñas.</p>
      ) : (
        <ol className={styles.ranking}>
          {entries.map((e, index) => (
            <li key={e.user.id}>
              <span className={styles.rank}>{index + 1}</span>
              <Avatar name={e.user.name} photoUrl={e.user.photoUrl} size={36} />
              <div className={styles.rankingName}>
                <strong>{e.user.name}</strong>
                <Stars value={e.avgRating} count={e.reviewCount} />
              </div>
              <Link to={`/tutors/${e.user.id}`}>Ver reseñas</Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function AdminAnalyticsPage() {
  const [ranking, setRanking] = useState<{ best: RankingEntry[]; worst: RankingEntry[] } | null>(null);
  const [demand, setDemand] = useState<DemandRow[]>([]);
  const [month, setMonth] = useState(currentMonth);
  const [stats, setStats] = useState<MonthStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getRanking(), getDemand()])
      .then(([r, d]) => {
        setRanking(r);
        setDemand(d);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    getMonthStats(month)
      .then(setStats)
      .catch((err) => setError(getErrorMessage(err)));
  }, [month]);

  if (!ranking) return error ? <p className="form-error">{error}</p> : <Loader text="Calculando métricas…" />;

  const completed = stats?.summary.COMPLETED ?? 0;
  const cancelled = stats?.summary.CANCELLED ?? 0;
  const total = completed + cancelled;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : null;
  const perDay = (stats?.perDay ?? []).map((d) => ({ ...d, label: d.day.slice(8) }));

  return (
    <div className={styles.page}>
      <h1>Reportes</h1>
      {error && <p className="form-error">{error}</p>}

      <div className={styles.twoCols}>
        <RankingList title="Mejor calificados" entries={ranking.best} />
        <RankingList title="Peor calificados" entries={ranking.worst} />
      </div>

      <section className={styles.card}>
        <h2>Demanda por categoría</h2>
        <p className={styles.muted}>Horas contratadas (sesiones aprobadas y cumplidas)</p>
        {demand.length === 0 ? (
          <p className={styles.muted}>Aún no hay horas contratadas.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={Math.max(200, demand.length * 44)}>
              <BarChart data={demand} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
                <CartesianGrid horizontal={false} stroke={CHART.grid} />
                <XAxis type="number" stroke={CHART.axis} fontSize={12} tickLine={false} />
                <YAxis type="category" dataKey="category" width={150} stroke={CHART.axis} fontSize={12} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(79, 70, 229, 0.06)' }}
                  formatter={(value) => [`${value} h`, 'Horas']}
                />
                <Bar dataKey="hours" name="Horas" fill={CHART.primary} radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
            <details className={styles.tableToggle}>
              <summary>Ver como tabla</summary>
              <table className={styles.table}>
                <thead>
                  <tr><th>Categoría</th><th>Horas</th><th>Sesiones</th></tr>
                </thead>
                <tbody>
                  {demand.map((d) => (
                    <tr key={d.categoryId}><td>{d.category}</td><td>{d.hours}</td><td>{d.sessions}</td></tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Tutorías del mes</h2>
          <label className="field">
            Mes
            <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
          </label>
        </div>

        <div className={styles.tiles}>
          <div className={styles.tile}>
            <span className={styles.tileLabel}>Impartidas</span>
            <span className={styles.tileValue}>{completed}</span>
          </div>
          <div className={styles.tile}>
            <span className={styles.tileLabel}>Canceladas</span>
            <span className={styles.tileValue}>{cancelled}</span>
          </div>
          <div className={styles.tile}>
            <span className={styles.tileLabel}>Tasa de cumplimiento</span>
            <span className={styles.tileValue}>{completionRate === null ? '—' : `${completionRate}%`}</span>
          </div>
          <div className={styles.tile}>
            <span className={styles.tileLabel}>Programadas</span>
            <span className={styles.tileValue}>{(stats?.summary.APPROVED ?? 0) + (stats?.summary.PENDING ?? 0)}</span>
          </div>
        </div>

        {perDay.length === 0 ? (
          <p className={styles.muted}>No hay sesiones en este mes.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={perDay} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis dataKey="label" stroke={CHART.axis} fontSize={12} tickLine={false} />
              <YAxis allowDecimals={false} stroke={CHART.axis} fontSize={12} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(79, 70, 229, 0.06)' }} labelFormatter={(label) => `Día ${label}`} />
              <Legend />
              <Bar dataKey="completed" name="Impartidas" stackId="day" fill={CHART.primary} stroke={CHART.surface} strokeWidth={2} />
              <Bar
                dataKey="cancelled"
                name="Canceladas"
                stackId="day"
                fill={CHART.cancelled}
                stroke={CHART.surface}
                strokeWidth={2}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  );
}
