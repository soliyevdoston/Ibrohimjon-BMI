'use client';

import { useMemo, useState } from 'react';
import { IconDots, IconPlus, IconSearch } from '@/components/admin/Icon';
import { initials, mockSellers, uzs } from '@/lib/admin-mock';

export default function AdminSellersPage() {
  const [q, setQ] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);

  const rows = useMemo(() => {
    return mockSellers.filter((s) => {
      if (onlyActive && !s.isActive) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (!s.brand.toLowerCase().includes(needle) && !s.owner.toLowerCase().includes(needle)) {
          return false;
        }
      }
      return true;
    });
  }, [q, onlyActive]);

  const activeCount = mockSellers.filter((s) => s.isActive).length;
  const totalRev = mockSellers.reduce((s, x) => s + x.revenueToday, 0);
  const totalOrders = mockSellers.reduce((s, x) => s + x.ordersToday, 0);

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Sellers</span>
            <span className="kpi-ico indigo">🏬</span>
          </div>
          <div className="kpi-value">{mockSellers.length}</div>
          <div className="kpi-meta">{activeCount} active</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Total orders today</span>
            <span className="kpi-ico sky">📦</span>
          </div>
          <div className="kpi-value">{totalOrders}</div>
          <div className="kpi-meta">Across all sellers</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Revenue today</span>
            <span className="kpi-ico green">💰</span>
          </div>
          <div className="kpi-value">{uzs(totalRev)}</div>
          <div className="kpi-meta">Gross turnover</div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Sellers</h3>
            <div className="card-sub">{rows.length} shown</div>
          </div>
          <div className="hstack">
            <label className="hstack" style={{ gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
              Only active
            </label>
            <div className="topbar-search" style={{ margin: 0, minWidth: 220 }}>
              <IconSearch size={15} />
              <input placeholder="Search brand, owner..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <button className="btn"><IconPlus size={14} /> Onboard seller</button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Rating</th>
                <th style={{ textAlign: 'right' }}>Products</th>
                <th style={{ textAlign: 'right' }}>Orders today</th>
                <th style={{ textAlign: 'right' }}>Revenue today</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="tcell-primary">
                      <span
                        className="avatar"
                        style={{
                          width: 32,
                          height: 32,
                          fontSize: 11,
                          background: 'linear-gradient(135deg, #fde68a, #fca5a5)',
                        }}
                      >
                        {initials(s.brand)}
                      </span>
                      <div>
                        <strong>{s.brand}</strong>
                        <div className="muted" style={{ fontSize: 12 }}>{s.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td>{s.owner}</td>
                  <td>
                    <span className={`chip ${s.isActive ? 'green' : 'gray'}`}>
                      {s.isActive ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td>
                    <span className="hstack" style={{ gap: 4 }}>
                      <span style={{ color: '#f59e0b' }}>★</span>
                      <strong>{s.rating.toFixed(1)}</strong>
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>{s.productsCount}</td>
                  <td style={{ textAlign: 'right' }}><strong>{s.ordersToday}</strong></td>
                  <td style={{ textAlign: 'right' }}>{uzs(s.revenueToday)}</td>
                  <td>
                    <button className="icon-btn" style={{ width: 30, height: 30 }} aria-label="Actions">
                      <IconDots size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">
                      <div className="empty-ico">∅</div>
                      <strong>No sellers match</strong>
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
