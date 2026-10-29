import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../api/categories';
import { searchTutors, type SearchFilters } from '../api/tutors';
import { getErrorMessage } from '../api/client';
import { Avatar } from '../components/ui/Avatar';
import { Loader } from '../components/ui/Loader';
import { Stars } from '../components/ui/Stars';
import { formatMoney, MODALITY_LABEL } from '../utils/format';
import type { Category, Modality, SearchResult } from '../types/api';
import styles from './SearchPage.module.scss';

interface FilterForm {
  categoryId: string;
  modality: '' | Modality;
  radiusKm: string;
  minRating: string;
  minReviews: string;
  minPrice: string;
  maxPrice: string;
}

const EMPTY_FILTERS: FilterForm = {
  categoryId: '',
  modality: '',
  radiusKm: '',
  minRating: '',
  minReviews: '',
  minPrice: '',
  maxPrice: '',
};

const toNumber = (value: string) => (value === '' ? undefined : Number(value));

function toSearchFilters(form: FilterForm): SearchFilters {
  return {
    categoryId: form.categoryId || undefined,
    modality: form.modality || undefined,
    radiusKm: toNumber(form.radiusKm),
    minRating: toNumber(form.minRating),
    minReviews: toNumber(form.minReviews),
    minPrice: toNumber(form.minPrice),
    maxPrice: toNumber(form.maxPrice),
  };
}

export default function SearchPage() {
  const [form, setForm] = useState<FilterForm>(EMPTY_FILTERS);
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    searchTutors({})
      .then(setResults)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof FilterForm>(field: K, value: FilterForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const runSearch = async (filters: FilterForm) => {
    setLoading(true);
    setError('');
    try {
      setResults(await searchTutors(toSearchFilters(filters)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    runSearch(form);
  };

  const clearFilters = () => {
    setForm(EMPTY_FILTERS);
    runSearch(EMPTY_FILTERS);
  };

  return (
    <div className={styles.layout}>
      <form className={styles.filters} onSubmit={handleSubmit}>
        <h2>Filtros</h2>

        <label className="field">
          Categoría
          <select value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)}>
            <option value="">Todas</option>
            {categories.map((parent) => (
              <optgroup key={parent.id} label={parent.name}>
                <option value={parent.id}>Todo {parent.name}</option>
                {parent.children?.map((child) => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="field">
          Modalidad
          <select value={form.modality} onChange={(e) => update('modality', e.target.value as FilterForm['modality'])}>
            <option value="">Cualquiera</option>
            {(Object.keys(MODALITY_LABEL) as Modality[]).map((m) => (
              <option key={m} value={m}>{MODALITY_LABEL[m]}</option>
            ))}
          </select>
        </label>

        <label className="field">
          Distancia máxima
          <select
            value={form.radiusKm}
            onChange={(e) => update('radiusKm', e.target.value)}
            disabled={form.modality === 'VIRTUAL'}
          >
            <option value="">Sin límite</option>
            <option value="2">A menos de 2 km</option>
            <option value="5">A menos de 5 km</option>
            <option value="10">A menos de 10 km</option>
            <option value="25">A menos de 25 km</option>
          </select>
        </label>

        <div className={styles.row}>
          <label className="field">
            Calificación
            <select value={form.minRating} onChange={(e) => update('minRating', e.target.value)}>
              <option value="">Cualquiera</option>
              <option value="3">3★ o más</option>
              <option value="4">4★ o más</option>
              <option value="4.5">4.5★ o más</option>
            </select>
          </label>
          <label className="field">
            Mín. reseñas
            <input
              type="number"
              min={0}
              value={form.minReviews}
              onChange={(e) => update('minReviews', e.target.value)}
            />
          </label>
        </div>

        <div className={styles.row}>
          <label className="field">
            Precio mín. (Q)
            <input type="number" min={0} value={form.minPrice} onChange={(e) => update('minPrice', e.target.value)} />
          </label>
          <label className="field">
            Precio máx. (Q)
            <input type="number" min={0} value={form.maxPrice} onChange={(e) => update('maxPrice', e.target.value)} />
          </label>
        </div>

        <div className={styles.filterActions}>
          <button type="button" className="btn btn--outline" onClick={clearFilters}>Limpiar</button>
          <button type="submit" className="btn">Buscar</button>
        </div>
      </form>

      <section>
        <div className={styles.resultsHeader}>
          <h1>Encuentra tu tutor</h1>
          {!loading && <span className={styles.muted}>{results.length} resultados</span>}
        </div>

        {error && <p className="form-error">{error}</p>}

        {loading ? (
          <Loader text="Buscando tutores…" />
        ) : results.length === 0 ? (
          <p className={styles.empty}>No encontramos tutores con esos filtros. Prueba ampliando la búsqueda.</p>
        ) : (
          <div className={styles.results}>
            {results.map((r) => (
              <Link key={r.id} to={`/tutors/${r.tutor.id}`} className={styles.result}>
                <div className={styles.tutor}>
                  <Avatar name={r.tutor.name} photoUrl={r.tutor.photoUrl} />
                  <div className={styles.tutorName}>
                    <strong>{r.tutor.name}</strong>
                    <Stars value={r.tutor.tutorProfile?.avgRating ?? 0} count={r.tutor.tutorProfile?.reviewCount ?? 0} />
                  </div>
                </div>
                <h3>{r.title}</h3>
                <span className={styles.category}>{r.category.name}</span>
                <div className={styles.tags}>
                  {r.modalities.map((m) => (
                    <span key={m} className="tag">{MODALITY_LABEL[m]}</span>
                  ))}
                </div>
                <div className={styles.footer}>
                  <span className={styles.price}>
                    {formatMoney(r.hourlyRate)}<small>/hora</small>
                  </span>
                  {r.distanceKm !== null && <span className={styles.muted}>a {r.distanceKm} km</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
