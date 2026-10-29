import { useNavigate } from 'react-router-dom';
import styles from './PoliciesPage.module.scss';

const POLICIES: { title: string; text: string }[] = [
  { title: 'Respeto', text: 'Trata a estudiantes y tutores con cortesía. No se toleran insultos, acoso ni discriminación.' },
  { title: 'Puntualidad y asistencia', text: 'Asiste a las sesiones agendadas. Si no puedes asistir, cancela con anticipación desde la plataforma.' },
  { title: 'Cobros justos', text: 'Solo se cobra lo acordado en la cotización de la plataforma. Cobros extra no pactados se consideran indebidos.' },
  { title: 'Información verídica', text: 'Tus datos de perfil, credenciales académicas y reseñas deben ser reales.' },
  { title: 'Denuncias y sanciones', text: 'Cualquier usuario puede denunciar una falta. El administrador revisa cada caso y puede suspender la cuenta.' },
  { title: 'Apelaciones', text: 'Si tu cuenta fue suspendida puedes apelar. La cuenta se reactiva cuando el administrador acepta la apelación.' },
];

export default function PoliciesPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <article className={`card ${styles.content}`}>
        <h1>Políticas de convivencia</h1>
        <ol className={styles.list}>
          {POLICIES.map((p) => (
            <li key={p.title}>
              <h2>{p.title}</h2>
              <p>{p.text}</p>
            </li>
          ))}
        </ol>
        <button className="btn btn--outline" onClick={() => navigate(-1)}>Volver</button>
      </article>
    </div>
  );
}