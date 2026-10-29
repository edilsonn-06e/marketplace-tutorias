import { useState } from 'react';
import styles from './StarInput.module.scss';

interface StarInputProps {
  value: number;
  onChange: (value: number) => void;
}

const LABELS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

export function StarInput({ value, onChange }: StarInputProps) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className={styles.wrapper}>
      <div className={styles.stars} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={n <= shown ? styles.on : styles.off}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
            aria-pressed={value === n}
          >
            ★
          </button>
        ))}
      </div>
      <span className={styles.label}>{LABELS[shown]}</span>
    </div>
  );
}
