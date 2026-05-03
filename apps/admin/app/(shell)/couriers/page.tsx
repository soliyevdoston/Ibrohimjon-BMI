'use client';

import { useMemo, useState } from 'react';
import { IconClose, IconCheck, IconPlus, IconSearch } from '@/components/admin/Icon';
import { initials } from '@/lib/admin-mock';
import { useCouriers, useBranches, type MockCourier } from '@/lib/admin-store';
import { CourierForm } from '@/components/admin/forms/CourierForm';

type Courier = MockCourier & { branchId?: string };
type FilterKey = 'ALL' | 'ONLINE' | 'OFFLINE' | 'BUSY' | 'AVAILABLE';

const filters: { key: FilterKey; label: string }[] = [
  { key: 'ALL',       label: 'Barchasi' },
  { key: 'ONLINE',    label: 'Onlayn' },
  { key: 'AVAILABLE', label: "Bo'sh" },
  { key: 'BUSY',      label: 'Yetkazmoqda' },
  { key: 'OFFLINE',   label: 'Oflayn' },
];

export default function AdminCouriersPage() {
  const { items: couriers, add, update, remove } = useCouriers();
  const { items: branches } = useBranches();
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Courier | null>(null);
  const [adding, setAdding] = useState(false);

  const rows = useMemo(() => {
    return couriers.filter((c) => {
      if (filter === 'ONLINE' && !c.isOnline) return false;
      if (filter === 'OFFLINE' && c.isOnline) return false;
      if (filter === 'BUSY' && !c.isBusy) return false;
      if (filter === 'AVAILABLE' && (!c.isOnline || c.isBusy)) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (!c.name.toLowerCase().includes(needle) && !c.zone.toLowerCase().includes(needle)) {
          return false;
        }
      }
      return true;
    });
  }, [filter, q, couriers]);

  const online = couriers.filter((c) => c.isOnline).length;
  const busy = couriers.filter((c) => c.isBusy).length;

  const handleSave = (c: Courier) => {
    if (couriers.find((x) => x.id === c.id)) update(c.id, c);
    else add(c);
  };

  const handleDelete = (c: Courier) => {
    if (confirm(`${c.name} kuryerni o'chirishni xohlaysizmi?`)) remove(c.id);
  };

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Jami kuryerlar</span>
            <span className="kpi-ico indigo">👥</span>
          </div>
          <div className="kpi-value">{couriers.length}</div>
          <div className="kpi-meta">Barcha zonalarda</div>
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
            <h3>Kuryerlar ro'yxati</h3>
            <div className="card-sub">{rows.length} ta ko'rsatilmoqda</div>
          </div>
          <div className="hstack">
            <div className="topbar-search" style={{ margin: 0, minWidth: 220 }}>
              <IconSearch size={15} />
              <input placeholder="Ism, zona..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <button className="btn" onClick={() => setAdding(true)}>
              <IconPlus size={14} /> Kuryer qo'shish
            </button>
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
                <th>Transport</th>
                <th>Filial</th>
                <th>Holat</th>
                <th>Reyting</th>
                <th style={{ textAlign: 'right' }}>Bugungi yetkazib berishlar</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const chip = !c.isOnline
                  ? { tone: 'gray', label: 'Oflayn' }
                  : c.isBusy
                    ? { tone: 'amber', label: 'Yetkazmoqda' }
                    : { tone: 'green', label: "Bo'sh" };
                const branch = branches.find((b) => b.id === c.branchId);
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="tcell-primary">
                        <span className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                          {initials(c.name)}
                        </span>
                        <div>
                          <strong>{c.name}</strong>
                          <div className="muted" style={{ fontSize: 12 }}>{c.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>{c.vehicle}</td>
                    <td>
                      {branch ? (
                        <span style={{ fontSize: 13 }}>
                          🏢 <strong>{branch.name}</strong>
                          <div className="muted" style={{ fontSize: 11 }}>{c.zone || branch.district}</div>
                        </span>
                      ) : (
                        <span className="muted" style={{ fontSize: 12 }}>{c.zone || '—'}</span>
                      )}
                    </td>
                    <td><span className={`chip ${chip.tone}`}>{chip.label}</span></td>
                    <td>
                      <span className="hstack" style={{ gap: 4 }}>
                        <span style={{ color: '#f59e0b' }}>★</span>
                        <strong>{c.rating.toFixed(1)}</strong>
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}><strong>{c.deliveriesToday}</strong></td>
                    <td>
                      <div className="hstack" style={{ gap: 4, justifyContent: 'flex-end' }}>
                        <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setEditing(c)} aria-label="Tahrirlash">
                          <IconCheck size={14} />
                        </button>
                        <button className="icon-btn" style={{ width: 30, height: 30, color: '#ef4444' }} onClick={() => handleDelete(c)} aria-label="O'chirish">
                          <IconClose size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <div className="empty-ico">∅</div>
                      <strong>Kuryerlar topilmadi</strong>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(adding || editing) && (
        <CourierForm
          open
          onClose={() => { setAdding(false); setEditing(null); }}
          initial={editing}
          branches={branches}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
