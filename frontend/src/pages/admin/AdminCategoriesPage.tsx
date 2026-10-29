import { useEffect, useState, type FormEvent } from 'react';
import { getCategories } from '../../api/categories';
import { createCategory, deleteCategory, updateCategory } from '../../api/admin';
import { getErrorMessage } from '../../api/client';
import { Loader } from '../../components/ui/Loader';
import type { Category } from '../../types/api';
import styles from '../../components/admin/Admin.module.scss';

interface CategoryForm {
  name: string;
  description: string;
  parentId: string;
}

const EMPTY_FORM: CategoryForm = { name: '', description: '', parentId: '' };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reload = () =>
    getCategories()
      .then(setCategories)
      .catch((err) => setError(getErrorMessage(err)));

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
  };

  const startEdit = (category: Category) => {
    setEditing(category);
    setForm({ name: category.name, description: category.description ?? '', parentId: category.parentId ?? '' });
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      parentId: form.parentId || null,
    };
    setSaving(true);
    setError('');
    try {
      if (editing) await updateCategory(editing.id, input);
      else await createCategory(input);
      await reload();
      resetForm();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    const extra = category.children?.length ? ` y sus ${category.children.length} subcategorías` : '';
    if (!window.confirm(`¿Eliminar "${category.name}"${extra}?`)) return;
    setError('');
    try {
      await deleteCategory(category.id);
      await reload();
      if (editing?.id === category.id) resetForm();
    } catch (err) {
      setError(`No se pudo eliminar: ${getErrorMessage(err)}. Si tiene ofertas asociadas, no se puede borrar.`);
    }
  };

  if (loading) return <Loader text="Cargando categorías…" />;

  const isParentWithChildren = !!editing?.children?.length;

  return (
    <div className={styles.page}>
      <h1>Categorías</h1>

      <div className={styles.split}>
        <form className={styles.card} onSubmit={handleSubmit}>
          <h2>{editing ? `Editar "${editing.name}"` : 'Nueva categoría'}</h2>
          <label className="field">
            Nombre
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              minLength={2}
              maxLength={80}
              required
            />
          </label>
          <label className="field">
            Descripción (opcional)
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={300}
              rows={2}
            />
          </label>
          <label className="field">
            Pertenece a
            <select
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              disabled={isParentWithChildren}
            >
              <option value="">Ninguna (categoría principal)</option>
              {categories
                .filter((c) => c.id !== editing?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
            {isParentWithChildren && <small>Tiene subcategorías, así que debe seguir siendo principal.</small>}
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className={styles.actions}>
            {editing && <button type="button" className="btn btn--outline" onClick={resetForm}>Cancelar</button>}
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>

        <section className={styles.card}>
          <h2>Catálogo</h2>
          {categories.length === 0 && <p className={styles.muted}>Aún no hay categorías.</p>}
          <ul className={styles.tree}>
            {categories.map((parent) => (
              <li key={parent.id}>
                <div className={styles.treeRow}>
                  <strong>{parent.name}</strong>
                  <div className={styles.rowActions}>
                    <button className={styles.linkButton} onClick={() => startEdit(parent)}>Editar</button>
                    <button className={`${styles.linkButton} ${styles.danger}`} onClick={() => handleDelete(parent)}>
                      Eliminar
                    </button>
                  </div>
                </div>
                {parent.children && parent.children.length > 0 && (
                  <ul>
                    {parent.children.map((child) => (
                      <li key={child.id} className={styles.treeRow}>
                        <span>{child.name}</span>
                        <div className={styles.rowActions}>
                          <button className={styles.linkButton} onClick={() => startEdit(child)}>Editar</button>
                          <button className={`${styles.linkButton} ${styles.danger}`} onClick={() => handleDelete(child)}>
                            Eliminar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
