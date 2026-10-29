import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCategories } from '../api/categories';
import { createOffer, deactivateOffer, getMyOffers, updateOffer, type OfferInput } from '../api/offers';
import { getErrorMessage } from '../api/client';
import { Loader } from '../components/ui/Loader';
import { formatMoney, MODALITY_LABEL } from '../utils/format';
import type { Category, Modality, Offer } from '../types/api';
import styles from './OffersPage.module.scss';

interface OfferForm {
  title: string;
  categoryId: string;
  description: string;
  modalities: Modality[];
  hourlyRate: string;
  perKmRate: string;
}

const EMPTY_FORM: OfferForm = {
  title: '',
  categoryId: '',
  description: '',
  modalities: ['VIRTUAL'],
  hourlyRate: '',
  perKmRate: '0',
};

const ALL_MODALITIES = Object.keys(MODALITY_LABEL) as Modality[];

export default function OffersPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<OfferForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const approved = user?.tutorProfile?.approval === 'APPROVED';

  useEffect(() => {
    Promise.all([getMyOffers(), getCategories()])
      .then(([myOffers, cats]) => {
        setOffers(myOffers);
        setCategories(cats);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof OfferForm>(field: K, value: OfferForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleModality = (m: Modality) => {
    const modalities = form.modalities.includes(m)
      ? form.modalities.filter((x) => x !== m)
      : [...form.modalities, m];
    setForm((prev) => ({
      ...prev,
      modalities,
      perKmRate: modalities.includes('STUDENT_HOME') ? prev.perKmRate : '0',
    }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
  };

  const startEdit = (offer: Offer) => {
    setEditingId(offer.id);
    setForm({
      title: offer.title,
      categoryId: offer.categoryId,
      description: offer.description ?? '',
      modalities: offer.modalities,
      hourlyRate: String(offer.hourlyRate),
      perKmRate: String(offer.perKmRate),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.modalities.length === 0) {
      setError('Elige al menos una modalidad');
      return;
    }
    const input: OfferInput = {
      title: form.title.trim(),
      categoryId: form.categoryId,
      description: form.description.trim(),
      modalities: form.modalities,
      hourlyRate: Number(form.hourlyRate),
      perKmRate: form.modalities.includes('STUDENT_HOME') ? Number(form.perKmRate) : 0,
    };

    setSaving(true);
    setError('');
    try {
      if (editingId) {
        const updated = await updateOffer(editingId, input);
        setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      } else {
        const created = await createOffer(input);
        setOffers((prev) => [created, ...prev]);
      }
      resetForm();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (offer: Offer) => {
    if (!window.confirm(`¿Desactivar "${offer.title}"? Los estudiantes ya no la verán.`)) return;
    try {
      await deactivateOffer(offer.id);
      setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, active: false } : o)));
      if (editingId === offer.id) resetForm();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <Loader text="Cargando tus ofertas…" />;

  return (
    <div className={styles.page}>
      <h1>Mis ofertas</h1>

      {!approved && (
        <p className={styles.notice}>
          Tu perfil de tutor todavía no está aprobado. Podrás crear ofertas cuando un administrador lo apruebe.
        </p>
      )}

      <div className={styles.layout}>
        {approved && (
          <form className={styles.card} onSubmit={handleSubmit}>
            <h2>{editingId ? 'Editar oferta' : 'Nueva oferta'}</h2>

            <label className="field">
              Título
              <input
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="Ej. Inglés conversacional para principiantes"
                minLength={5}
                maxLength={120}
                required
              />
            </label>

            <label className="field">
              Categoría
              <select value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)} required>
                <option value="" disabled>Elige una categoría</option>
                {categories.map((parent) => (
                  <optgroup key={parent.id} label={parent.name}>
                    <option value={parent.id}>{parent.name} (general)</option>
                    {parent.children?.map((child) => (
                      <option key={child.id} value={child.id}>{child.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <label className="field">
              Descripción
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                maxLength={1000}
                rows={4}
              />
            </label>

            <fieldset className={styles.modalities}>
              <legend>Modalidades</legend>
              {ALL_MODALITIES.map((m) => (
                <label key={m} className={styles.check}>
                  <input
                    type="checkbox"
                    checked={form.modalities.includes(m)}
                    onChange={() => toggleModality(m)}
                  />
                  {MODALITY_LABEL[m]}
                </label>
              ))}
            </fieldset>

            <div className={styles.grid}>
              <label className="field">
                Tarifa por hora (Q)
                <input
                  type="number"
                  min={1}
                  max={5000}
                  step="0.01"
                  value={form.hourlyRate}
                  onChange={(e) => update('hourlyRate', e.target.value)}
                  required
                />
              </label>
              <label className="field">
                Tarifa por km (Q)
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={form.perKmRate}
                  onChange={(e) => update('perKmRate', e.target.value)}
                  disabled={!form.modalities.includes('STUDENT_HOME')}
                />
                <small>Solo aplica a domicilio</small>
              </label>
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className={styles.actions}>
              {editingId && (
                <button type="button" className="btn btn--outline" onClick={resetForm}>Cancelar</button>
              )}
              <button type="submit" className="btn" disabled={saving}>
                {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Publicar oferta'}
              </button>
            </div>
          </form>
        )}

        <section className={styles.list}>
          {offers.length === 0 ? (
            <p className={styles.empty}>Todavía no tienes ofertas publicadas.</p>
          ) : (
            offers.map((offer) => (
              <article
                key={offer.id}
                className={`${styles.offer} ${offer.active ? '' : styles.inactive} ${editingId === offer.id ? styles.editing : ''}`}
              >
                <div className={styles.offerHeader}>
                  <h3>{offer.title}</h3>
                  {!offer.active && <span className="badge badge--CANCELLED">Desactivada</span>}
                </div>
                <span className={styles.category}>{offer.category.name}</span>
                {offer.description && <p className={styles.muted}>{offer.description}</p>}
                <div className={styles.tags}>
                  {offer.modalities.map((m) => (
                    <span key={m} className="tag">{MODALITY_LABEL[m]}</span>
                  ))}
                </div>
                <strong>
                  {formatMoney(offer.hourlyRate)}/hora
                  {offer.perKmRate > 0 && ` · ${formatMoney(offer.perKmRate)}/km`}
                </strong>
                {offer.active && approved && (
                  <div className={styles.actions}>
                    <button className="btn btn--outline" onClick={() => startEdit(offer)}>Editar</button>
                    <button className="btn btn--danger" onClick={() => handleDeactivate(offer)}>Desactivar</button>
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
