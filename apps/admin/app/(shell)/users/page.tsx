'use client';

import { useMemo, useState } from 'react';
import { IconSearch } from '@/components/admin/Icon';
import { initials } from '@/lib/admin-mock';
import { useApiUsers } from '@/lib/admin-api';

function uzs(value: number) {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' soʼm';
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('uz-UZ');
}

export default function AdminUsersPage() {
  const { items: users, loading } = useApiUsers();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'CUSTOMER' | 'SELLER' | 'COURIER' | 'ADMIN'>('ALL');

  const customers = useMemo(() => users.filter((u) => u.role === 'CUSTOMER'), [users]);
  const verified = customers.filter((c) => c.isPhoneVerified || c.isEmailVerified).length;
  const blocked = users.filter((c) => c.status === 'BLOCKED').length;

  const rows = useMemo(() => {
    return users.filter((u) => {
      if (filter !== 'ALL' && u.role !== filter) return false;
      if (q) {
        const needle = q.toLowerCase();
        const haystack = `${u.fullName ?? ''} ${u.phone ?? ''} ${u.email ?? ''}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [q, filter, users]);

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Foydalanuvchilar</span>
            <span className="kpi-ico indigo">👤</span>
          </div>
          <div className="kpi-value">{users.length}</div>
          <div className="kpi-meta">{verified} tasdiqlangan, {blocked} bloklangan</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Mijozlar</span>
            <span className="kpi-ico sky">🛒</span>
          </div>
          <div className="kpi-value">{customers.length}</div>
          <div className="kpi-meta">CUSTOMER roli</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Sotuvchi/Kuryer</span>
            <span className="kpi-ico green">🏪</span>
          </div>
          <div className="kpi-value">
            {users.filter((u) => u.role === 'SELLER').length} / {users.filter((u) => u.role === 'COURIER').length}
          </div>
          <div className="kpi-meta">Hisoblar soni</div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Foydalanuvchilar</h3>
            <div className="card-sub">{loading ? 'yuklanmoqda…' : `${rows.length} ta ko'rsatilmoqda`}</div>
          </div>
          <div className="hstack">
            <div className="hstack" style={{ gap: 6 }}>
              <button onClick={() => setFilter('ALL')} className={`btn ${filter === 'ALL' ? 'soft' : 'ghost'} sm`}>Barchasi</button>
              <button onClick={() => setFilter('CUSTOMER')} className={`btn ${filter === 'CUSTOMER' ? 'soft' : 'ghost'} sm`}>Mijozlar</button>
              <button onClick={() => setFilter('SELLER')} className={`btn ${filter === 'SELLER' ? 'soft' : 'ghost'} sm`}>Sotuvchilar</button>
              <button onClick={() => setFilter('COURIER')} className={`btn ${filter === 'COURIER' ? 'soft' : 'ghost'} sm`}>Kuryerlar</button>
              <button onClick={() => setFilter('ADMIN')} className={`btn ${filter === 'ADMIN' ? 'soft' : 'ghost'} sm`}>Admin</button>
            </div>
            <div className="topbar-search" style={{ margin: 0, minWidth: 220 }}>
              <IconSearch size={15} />
              <input placeholder="Ism, telefon, email..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Foydalanuvchi</th>
                <th>Aloqa</th>
                <th>Rol</th>
                <th>Holat</th>
                <th>Tasdiqlangan</th>
                <th style={{ textAlign: 'right' }}>Yaratilgan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} style={u.status === 'BLOCKED' ? { opacity: 0.55 } : undefined}>
                  <td>
                    <div className="tcell-primary">
                      <span className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                        {initials(u.fullName ?? u.email ?? u.phone ?? '?')}
                      </span>
                      <strong>{u.fullName ?? '—'}</strong>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12 }}>{u.phone ?? '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email ?? '—'}</div>
                  </td>
                  <td><span className="chip gray">{u.role}</span></td>
                  <td>
                    <span className={`chip ${u.status === 'BLOCKED' ? 'rose' : u.status === 'PENDING' ? 'amber' : 'green'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    {u.isPhoneVerified && <span className="chip green sm">📞</span>}{' '}
                    {u.isEmailVerified && <span className="chip green sm">✉</span>}
                    {!u.isPhoneVerified && !u.isEmailVerified && <span className="muted">—</span>}
                  </td>
                  <td style={{ textAlign: 'right' }} className="muted">{fmtDate(u.createdAt)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">
                      <div className="empty-ico">∅</div>
                      <strong>{loading ? 'Yuklanmoqda…' : 'Foydalanuvchilar topilmadi'}</strong>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Suppress unused-vars while uzs helper kept for future totals */}
      <span style={{ display: 'none' }}>{uzs(0)}</span>
    </div>
  );
}
