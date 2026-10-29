import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTutorProfile } from '../api/tutors';
import { startConversation } from '../api/chat';
import { getErrorMessage } from '../api/client';
import { Avatar } from '../components/ui/Avatar';
import { Loader } from '../components/ui/Loader';
import { Stars } from '../components/ui/Stars';
import { DAY_NAMES, formatDate, formatMoney, MODALITY_LABEL } from '../utils/format';
import type { TutorPublicProfile } from '../types/api';
import styles from './TutorProfilePage.module.scss';

function buildShareText(profile: TutorPublicProfile, url: string) {
  const info = profile.tutorProfile;
  const offers = profile.offers
    .map((o) => `• ${o.title} (${o.category.name}): ${formatMoney(o.hourlyRate)}/hora`)
    .join('\n');

  return [
    `*${profile.name}* da tutorías en TutoríasGT`,
    info ? `⭐ ${info.avgRating.toFixed(1)} (${info.reviewCount} reseñas)` : '',
    info ? `Tarifa base: ${formatMoney(info.baseRate)}/hora` : '',
    '',
    offers,
    '',
    `Ver perfil: ${url}`,
  ].join('\n');
}

export default function TutorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<TutorPublicProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getTutorProfile(id)
      .then(setProfile)
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  if (error) return <p className="form-error">{error}</p>;
  if (!profile) return <Loader text="Cargando perfil…" />;

  const info = profile.tutorProfile;

  const shareOnWhatsApp = () => {
    const text = buildShareText(profile, window.location.href);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  const openChat = async () => {
    try {
      const conversation = await startConversation(profile.id);
      navigate(`/chat/${conversation.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const schedule = DAY_NAMES.map((day, index) => ({
    day,
    slots: profile.availability.filter((a) => a.dayOfWeek === index),
  })).filter((d) => d.slots.length > 0);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Avatar name={profile.name} photoUrl={profile.photoUrl} size={96} />
        <div className={styles.headerInfo}>
          <h1>{profile.name}</h1>
          <Stars value={info?.avgRating ?? 0} count={info?.reviewCount ?? 0} />
          {info && <span className={styles.muted}>Tarifa base: {formatMoney(info.baseRate)}/hora</span>}
          <span className={styles.muted}>Miembro desde {formatDate(profile.createdAt)}</span>
        </div>
        <div className={styles.actions}>
          {user?.role === 'STUDENT' && (
            <button className="btn btn--outline" onClick={openChat}>Enviar mensaje</button>
          )}
          <button className={`btn ${styles.whatsapp}`} onClick={shareOnWhatsApp}>
            Compartir por WhatsApp
          </button>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.main}>
          {info && (
            <section className={styles.section}>
              <h2>Sobre mí</h2>
              <p className={styles.bio}>{info.bio}</p>
              <a href={info.cvUrl} target="_blank" rel="noreferrer">Ver hoja de vida / portafolio</a>
            </section>
          )}

          <section className={styles.section}>
            <h2>Tutorías que ofrece</h2>
            {profile.offers.length === 0 ? (
              <p className={styles.muted}>Este tutor todavía no tiene ofertas activas.</p>
            ) : (
              <div className={styles.offers}>
                {profile.offers.map((offer) => (
                  <article key={offer.id} className={styles.offer}>
                    <h3>{offer.title}</h3>
                    <span className={styles.category}>{offer.category.name}</span>
                    {offer.description && <p>{offer.description}</p>}
                    <div className={styles.tags}>
                      {offer.modalities.map((m) => (
                        <span key={m} className="tag">{MODALITY_LABEL[m]}</span>
                      ))}
                    </div>
                    <div className={styles.offerFooter}>
                      <div className={styles.rates}>
                        <span>{formatMoney(offer.hourlyRate)}/hora</span>
                        {offer.modalities.includes('STUDENT_HOME') && offer.perKmRate > 0 && (
                          <span className={styles.muted}>+ {formatMoney(offer.perKmRate)}/km a domicilio</span>
                        )}
                      </div>
                      {user?.role === 'STUDENT' && (
                        <Link to={`/hire/${profile.id}/${offer.id}`} className="btn">Contratar</Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className={styles.section}>
            <h2>Reseñas</h2>
            {profile.reviews.length === 0 ? (
              <p className={styles.muted}>Aún no tiene reseñas.</p>
            ) : (
              <ul className={styles.reviews}>
                {profile.reviews.map((review) => (
                  <li key={review.id} className={styles.review}>
                    <Avatar name={review.student.name} photoUrl={review.student.photoUrl} size={40} />
                    <div>
                      <div className={styles.reviewHeader}>
                        <strong>{review.student.name}</strong>
                        <Stars value={review.rating} />
                        <span className={styles.muted}>{formatDate(review.createdAt)}</span>
                      </div>
                      <p>{review.comment}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className={styles.section}>
          <h2>Disponibilidad</h2>
          {schedule.length === 0 ? (
            <p className={styles.muted}>Sin horario publicado.</p>
          ) : (
            <ul className={styles.schedule}>
              {schedule.map(({ day, slots }) => (
                <li key={day}>
                  <strong>{day}</strong>
                  <span>{slots.map((s) => `${s.startTime}–${s.endTime}`).join(', ')}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
