import styles from './Loader.module.scss';

export function Loader({ text = 'Cargando…', fullScreen = false }: { text?: string; fullScreen?: boolean }) {
  return (
    <div className={fullScreen ? styles.fullScreen : styles.inline}>
      <span className={styles.spinner} />
      <p>{text}</p>
    </div>
  );
}
