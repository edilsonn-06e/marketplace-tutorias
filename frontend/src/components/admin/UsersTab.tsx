import { useEffect, useState, type FormEvent } from 'react';
import { getUsers, reactivateUser, suspendUser } from '../../api/admin';
import { getErrorMessage } from '../../api/client';
import { Avatar } from '../ui/Avatar';
import { Loader } from '../ui/Loader';
import { Modal } from '../ui/Modal';
import { UserHistoryModal } from './UserHistoryModal';
import { ROLE_LABEL } from '../../utils/format';
import type { Role, UserStatus } from '../../types/api';
import type { AdminUserRow } from '../../types/admin';
import styles from './Admin.module.scss';

export function UsersTab() {
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [suspending, setSuspending] = useState<AdminUserRow | null>(null);

  useEffect(() => {
    setLoading(true);
    getUsers({ role: role || undefined, status: status || undefined, q: search || undefined })
      .then(setUsers)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [role, status, search]);

  const setUserStatus = (id: string, newStatus: UserStatus) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u)));
  };

  const handleReactivate = async (user: AdminUserRow) => {
    if (!window.confirm(`¿Reactivar la cuenta de ${user.name}?`)) return;
    try {
      await reactivateUser(user.id);
      setUserStatus(user.id, 'ACTIVE');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearch(query.trim());
  };

  return (
    <>
      <form className={styles.toolbar} onSubmit={handleSearch}>
        <label className="field">
          Buscar
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nombre o correo" />
        </label>
        <label className="field">
          Rol
          <select value={role} onChange={(e) => setRole(e.target.value as Role | '')}>
            <option value="">Todos</option>
            <option value="STUDENT">Estudiantes</option>
            <option value="TUTOR">Tutores</option>
            <option value="ADMIN">Administradores</option>
          </select>
        </label>
        <label className="field">
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value as UserStatus | '')}>
            <option value="">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="SUSPENDED">Suspendidos</option>
          </select>
        </label>
        <button type="submit" className="btn">Buscar</button>
      </form>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <Loader text="Cargando usuarios…" />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Denuncias</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className={styles.person}>
                      <Avatar name={u.name} photoUrl={u.photoUrl} size={32} />
                      <div>
                        <strong>{u.name}</strong>
                        <span className={styles.muted}>{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{u.role ? ROLE_LABEL[u.role] : 'Sin rol'}</td>
                  <td>{u._count.reportsReceived}</td>
                  <td>
                    <span className={`badge badge--${u.status === 'ACTIVE' ? 'COMPLETED' : 'REJECTED'}`}>
                      {u.status === 'ACTIVE' ? 'Activo' : 'Suspendido'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <button className={styles.linkButton} onClick={() => setHistoryId(u.id)}>Historial</button>
                      {u.role !== 'ADMIN' &&
                        (u.status === 'ACTIVE' ? (
                          <button className={`${styles.linkButton} ${styles.danger}`} onClick={() => setSuspending(u)}>
                            Suspender
                          </button>
                        ) : (
                          <button className={styles.linkButton} onClick={() => handleReactivate(u)}>Reactivar</button>
                        ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className={styles.muted} style={{ padding: 16 }}>No se encontraron usuarios.</p>}
        </div>
      )}

      {historyId && <UserHistoryModal userId={historyId} onClose={() => setHistoryId(null)} />}
      {suspending && (
        <SuspendModal
          user={suspending}
          onClose={() => setSuspending(null)}
          onDone={() => {
            setUserStatus(suspending.id, 'SUSPENDED');
            setSuspending(null);
          }}
        />
      )}
    </>
  );
}

interface SuspendModalProps {
  user: AdminUserRow;
  onClose: () => void;
  onDone: () => void;
}

function SuspendModal({ user, onClose, onDone }: SuspendModalProps) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await suspendUser(user.id, reason.trim());
      onDone();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Suspender a ${user.name}`} onClose={onClose}>
      <form className={styles.card} onSubmit={handleSubmit} style={{ boxShadow: 'none', border: 0, padding: 0 }}>
        <label className="field">
          Motivo (lo verá el usuario)
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} minLength={5} maxLength={500} rows={3} required />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className={styles.actions}>
          <button type="submit" className="btn btn--danger" disabled={busy}>Suspender cuenta</button>
          <button type="button" className="btn btn--outline" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </Modal>
  );
}
