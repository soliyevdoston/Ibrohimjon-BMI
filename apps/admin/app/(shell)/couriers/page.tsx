'use client';

import { useMemo, useState } from 'react';
import { IconSearch } from '@/components/admin/Icon';
import { initials } from '@/lib/admin-mock';
import { useApiCouriers } from '@/lib/admin-api';

type FilterKey = 'ALL' | 'ONLINE' | 'OFFLINE' | 'BUSY' | 'AVAILABLE';

const filters: { key: FilterKey; label: string }[] = [
  { key: 'ALL',       label: 'Barchasi' },
  { key: 'ONLINE',    label: 'Onlayn' },
  { key: 'AVAILABLE', label: "Bo'sh" },
  { key: 'BUSY',      label: 'Yetkazmoqda' },
  { key: 'OFFLINE',   label: 'Oflayn' },
];

export default function AdminCouriersPage() {
  const { items: couriers, loading } = useApiCouriers();
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    return couriers.filter((c) => {
      const busy = c.isOnline && !c.isAvailable;
      if (filter === 'ONLINE' && !c.isOnline) return false;
      if (filter === 'OFFLINE' && c.isOnline) return false;
      if (filter === 'BUSY' && !busy) return false;
      if (filter === 'AVAILABLE' && (!c.isOnline || !c.isAvailable)) return false;
      if (q) {
        const needle = q.toLowerCase();
        const haystack = `${c.user.fullName ?? ''} ${c.user.phone ?? ''} ${c.vehicleModel ?? ''} ${c.vehiclePlate ?? ''}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [filter, q, couriers]);

  const online = couriers.filter((c) => c.isOnline).length;
  const busy = couriers.filter((c) => c.isOnline && !c.isAvailable).length;

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Jami kuryerlar</span>
            <span className="kpi-ico indigo">👥</span>
          </div>
          <div className="kpi-value">{couriers.length}</div>
          <div className="kpi-meta">Ro&apos;yxatdan o&apos;tgan</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Hozir onlayn</span>
            <span className="kpi-ico green">●</span>
          </div>
          <div className="kpi-value">{online}</div>
          <div className="kpi-meta">{Math.round((online / Math.max(couriers.length, 1)) * 100)}% faol</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Yetkazmoqda</span>
            <span className="kpi-ico amber">↗</span>
          </div>
          <div className="kpi-value">{busy}</div>
          <div className="kpi-meta">Faol buyurtmalar</div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Kuryerlar ro&apos;yxati</h3>
            <div className="card-sub">{loading ? 'yuklanmoqda…' : `${rows.length} ta ko'rsatilmoqda`}</div>
          </div>
          <div className="hstack">
            <div className="topbar-search" style={{ margin: 0, minWidth: 220 }}>
              <IconSearch size={15} />
              <input placeholder="Ism, raqam, transport..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="hstack" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`btn ${filter === f.key ? 'soft' : 'ghost'} sm`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Kuryer</th>
                <th>Transport turi</th>
                <th>Model / Raqam</th>
                <th>Holat</th>
                <th>Maksimal yuk (kg)</th>
                <th style={{ textAlign: 'right' }}>Oxirgi onlayn</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const busyC = c.isOnline && !c.isAvailable;
                const chip = !c.isOnline
                  ? { tone: 'gray', label: 'Oflayn' }
                  : busyC
                    ? { tone: 'amber', label: 'Yetkazmoqda' }
                    : { tone: 'green', label: "Bo'sh" };
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="tcell-primary">
                        <span className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                          {initials(c.user.fullName ?? '?')}
                        </span>
                        <div>
                          <strong>{c.user.fullName ?? '—'}</strong>
                          <div className="muted" style={{ fontSize: 12 }}>{c.user.phone ?? c.user.email ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{c.vehicleType}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>{c.vehicleModel ?? '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.vehiclePlate ?? '—'}</div>
                    </td>
                    <td><span className={`chip ${chip.tone}`}>{chip.label}</span></td>
                    <td>{Number(c.maxLoadKg).toFixed(0)}</td>
                    <td style={{ textAlign: 'right' }} className="muted">
                      {c.lastSeenAt ? new Date(c.lastSeenAt).toLocaleString('uz-UZ') : '—'}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">
                      <div className="empty-ico">∅</div>
                      <strong>{loading ? 'Yuklanmoqda…' : 'Kuryerlar topilmadi'}</strong>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
