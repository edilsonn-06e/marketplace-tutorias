import styles from './Stars.module.scss';

interface StarsProps {
  value: number;
  count?: number;
}

export function Stars({ value, count }: StarsProps) {
  if (count === 0) return <span className={styles.count}>Sin reseñas</span>;

  const rounded = Math.round(value);
  return (
    <span className={styles.stars} aria-label={`${value.toFixed(1)} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rounded ? styles.on : styles.off}>★</span>
      ))}
      <span className={styles.value}>{value.toFixed(1)}</span>
      {count !== undefined && <span className={styles.count}>({count})</span>}
    </span>
  );
}
