'use client';

import { useMemo, useState } from 'react';
import { IconDots, IconPlus, IconSearch } from '@/components/admin/Icon';
import { initials, mockCouriers } from '@/lib/admin-mock';

type FilterKey = 'ALL' | 'ONLINE' | 'OFFLINE' | 'BUSY' | 'AVAILABLE';

const filters: { key: FilterKey; label: string }[] = [
  { key: 'ALL',       label: 'All' },
  { key: 'ONLINE',    label: 'Online' },
  { key: 'AVAILABLE', label: 'Available' },
  { key: 'BUSY',      label: 'On delivery' },
  { key: 'OFFLINE',   label: 'Offline' },
];

export default function AdminCouriersPage() {
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    return mockCouriers.filter((c) => {
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
  }, [filter, q]);

  const online = mockCouriers.filter((c) => c.isOnline).length;
  const busy = mockCouriers.filter((c) => c.isBusy).length;

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Total couriers</span>
            <span className="kpi-ico indigo">👥</span>
          </div>
          <div className="kpi-value">{mockCouriers.length}</div>
          <div className="kpi-meta">Across all zones</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Online now</span>
            <span className="kpi-ico green">●</span>
          </div>
          <div className="kpi-value">{online}</div>
          <div className="kpi-meta">{Math.round((online / mockCouriers.length) * 100)}% active</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">On delivery</span>
            <span className="kpi-ico amber">↗</span>
          </div>
          <div className="kpi-value">{busy}</div>
          <div className="kpi-meta">Handling live orders</div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Courier roster</h3>
            <div className="card-sub">{rows.length} shown</div>
          </div>
          <div className="hstack">
            <div className="topbar-search" style={{ margin: 0, minWidth: 220 }}>
              <IconSearch size={15} />
              <input placeholder="Search name, zone..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <button className="btn"><IconPlus size={14} /> Add courier</button>
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
                <th>Courier</th>
                <th>Vehicle</th>
                <th>Zone</th>
                <th>Status</th>
                <th>Rating</th>
                <th style={{ textAlign: 'right' }}>Deliveries today</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const chip = !c.isOnline
                  ? { tone: 'gray', label: 'Offline' }
                  : c.isBusy
                    ? { tone: 'amber', label: 'On delivery' }
                    : { tone: 'green', label: 'Available' };
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
                    <td>{c.zone}</td>
                    <td><span className={`chip ${chip.tone}`}>{chip.label}</span></td>
                    <td>
                      <span className="hstack" style={{ gap: 4 }}>
                        <span style={{ color: '#f59e0b' }}>★</span>
                        <strong>{c.rating.toFixed(1)}</strong>
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}><strong>{c.deliveriesToday}</strong></td>
                    <td>
                      <button className="icon-btn" style={{ width: 30, height: 30 }} aria-label="Actions">
                        <IconDots size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <div className="empty-ico">∅</div>
                      <strong>No couriers match these filters</strong>
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
