import styles from './Avatar.module.scss';

interface AvatarProps {
  name: string;
  photoUrl: string | null;
  size?: number;
}

export function Avatar({ name, photoUrl, size = 48 }: AvatarProps) {
  const style = { width: size, height: size, fontSize: size * 0.4 };

  if (photoUrl) {
    return <img className={styles.avatar} src={photoUrl} alt="" style={style} referrerPolicy="no-referrer" />;
  }
  return (
    <span className={styles.avatar} style={style} aria-hidden="true">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
