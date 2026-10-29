import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCategories } from '../api/categories';
import { completeOnboarding, type OnboardingPayload } from '../api/users';
import { getErrorMessage } from '../api/client';
import { MapPicker } from '../components/map/MapPicker';
import type { LatLng } from '../components/map/leaflet';
import type { Category, Gender } from '../types/api';
import styles from './OnboardingPage.module.scss';

type MainRole = 'STUDENT' | 'TUTOR';

interface FormState {
  role: MainRole;
  phone: string;
  gender: Gender;
  address: string;
  idDocument: string;
  bio: string;
  cvUrl: string;
  baseRate: string;
}

const INITIAL_FORM: FormState = {
  role: 'STUDENT',
  phone: '',
  gender: 'UNSPECIFIED',
  address: '',
  idDocument: '',
  bio: '',
  cvUrl: '',
  baseRate: '',
};

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'FEMALE', label: 'Femenino' },
  { value: 'MALE', label: 'Masculino' },
  { value: 'OTHER', label: 'Otro' },
  { value: 'UNSPECIFIED', label: 'Prefiero no decirlo' },
];

const ROLE_OPTIONS: { value: MainRole; title: string; text: string }[] = [
  { value: 'STUDENT', title: 'Estudiante', text: 'Quiero encontrar tutores y contratar clases' },
  { value: 'TUTOR', title: 'Tutor', text: 'Quiero ofrecer mis clases y conseguir alumnos' },
];

export default function OnboardingPage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (user?.onboarded) return <Navigate to="/" replace />;

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!location) {
      setError('Marca tu ubicación en el mapa');
      return;
    }
    if (selected.length === 0) {
      setError('Elige al menos una categoría');
      return;
    }

    const payload: OnboardingPayload = {
      role: form.role,
      phone: form.phone.trim(),
      gender: form.gender,
      address: form.address.trim(),
      lat: location.lat,
      lng: location.lng,
      idDocument: form.idDocument.trim(),
      categoryIds: selected,
    };
    if (form.role === 'TUTOR') {
      payload.tutor = { bio: form.bio.trim(), cvUrl: form.cvUrl.trim(), baseRate: Number(form.baseRate) };
    }

    setSaving(true);
    setError('');
    try {
      const updated = await completeOnboarding(payload);
      setUser(updated);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <header>
          <h1>Completa tu perfil</h1>
          <p className={styles.muted}>Hola {user?.name}, necesitamos algunos datos antes de empezar.</p>
        </header>

        <section className={styles.section}>
          <h2>¿Cómo usarás la plataforma?</h2>
          <div className={styles.roles}>
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.roleCard} ${form.role === opt.value ? styles.active : ''}`}
                onClick={() => update('role', opt.value)}
                aria-pressed={form.role === opt.value}
              >
                <strong>{opt.title}</strong>
                <span>{opt.text}</span>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>Datos personales</h2>
          <div className={styles.grid}>
            <label className="field">
              Teléfono / WhatsApp
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="+502 5555 5555"
                pattern="\+?[0-9 ]{8,15}"
                required
              />
            </label>
            <label className="field">
              Género
              <select value={form.gender} onChange={(e) => update('gender', e.target.value as Gender)}>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Documento de identificación (DPI)
              <input
                value={form.idDocument}
                onChange={(e) => update('idDocument', e.target.value)}
                minLength={5}
                maxLength={30}
                required
              />
            </label>
            <label className="field">
              Dirección
              <input
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Zona, colonia, municipio"
                minLength={5}
                maxLength={200}
                required
              />
            </label>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Ubicación en el mapa</h2>
          <MapPicker value={location} onChange={setLocation} />
        </section>

        <section className={styles.section}>
          <h2>{form.role === 'TUTOR' ? '¿Qué enseñas?' : '¿Qué te interesa aprender?'}</h2>
          {categories.map((parent) => (
            <div key={parent.id} className={styles.categoryGroup}>
              <h3>{parent.name}</h3>
              <div className={styles.chips}>
                {[parent, ...(parent.children ?? [])].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`${styles.chip} ${selected.includes(cat.id) ? styles.active : ''}`}
                    onClick={() => toggleCategory(cat.id)}
                    aria-pressed={selected.includes(cat.id)}
                  >
                    {cat.id === parent.id ? 'General' : cat.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        {form.role === 'TUTOR' && (
          <section className={styles.section}>
            <h2>Perfil profesional</h2>
            <label className="field">
              Biografía profesional
              <textarea
                value={form.bio}
                onChange={(e) => update('bio', e.target.value)}
                minLength={30}
                maxLength={2000}
                required
              />
              <small>{form.bio.length}/30 caracteres mínimos</small>
            </label>
            <div className={styles.grid}>
              <label className="field">
                Hoja de vida (enlace al PDF o portafolio)
                <input
                  type="url"
                  value={form.cvUrl}
                  onChange={(e) => update('cvUrl', e.target.value)}
                  placeholder="https://drive.google.com/..."
                  required
                />
              </label>
              <label className="field">
                Tarifa base por hora (Q)
                <input
                  type="number"
                  min={1}
                  max={5000}
                  step="0.01"
                  value={form.baseRate}
                  onChange={(e) => update('baseRate', e.target.value)}
                  required
                />
              </label>
            </div>
          </section>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className={styles.actions}>
          <button type="button" className="btn btn--outline" onClick={() => { logout(); navigate('/login'); }}>
            Salir
          </button>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar y continuar'}
          </button>
        </div>
      </form>
    </div>
  );
}