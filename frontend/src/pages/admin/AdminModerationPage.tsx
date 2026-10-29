import { useState } from 'react';
import { PendingTutorsTab } from '../../components/admin/PendingTutorsTab';
import { ReportsTab } from '../../components/admin/ReportsTab';
import { AppealsTab } from '../../components/admin/AppealsTab';
import { UsersTab } from '../../components/admin/UsersTab';
import styles from '../../components/admin/Admin.module.scss';

type Tab = 'tutors' | 'reports' | 'appeals' | 'users';

const TABS: { value: Tab; label: string }[] = [
  { value: 'reports', label: 'Denuncias' },
  { value: 'appeals', label: 'Apelaciones' },
  { value: 'tutors', label: 'Tutores por aprobar' },
  { value: 'users', label: 'Usuarios' },
];

export default function AdminModerationPage() {
  const [tab, setTab] = useState<Tab>('reports');

  return (
    <div className={styles.page}>
      <h1>Centro de moderación</h1>

      <div className={styles.tabs} role="tablist">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            className={`${styles.tab} ${tab === t.value ? styles.active : ''}`}
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'reports' && <ReportsTab />}
      {tab === 'appeals' && <AppealsTab />}
      {tab === 'tutors' && <PendingTutorsTab />}
      {tab === 'users' && <UsersTab />}
    </div>
  );
}
