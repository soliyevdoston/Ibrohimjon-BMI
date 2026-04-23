'use client';

import { useMemo, useState } from 'react';
import { IconDots, IconSearch } from '@/components/admin/Icon';
import { initials, mockCustomers, uzs } from '@/lib/admin-mock';

export default function AdminUsersPage() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');

  const rows = useMemo(() => {
    return mockCustomers.filter((c) => {
      if (filter === 'VERIFIED' && !c.isVerified) return false;
      if (filter === 'UNVERIFIED' && c.isVerified) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (!c.name.toLowerCase().includes(needle) && !c.phone.toLowerCase().includes(needle)) {
          return false;
        }
      }
      return true;
    });
  }, [q, filter]);

  const verified = mockCustomers.filter((c) => c.isVerified).length;
  const totalSpend = mockCustomers.reduce((s, x) => s + x.spend, 0);

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Customers</span>
            <span className="kpi-ico indigo">👤</span>
          </div>
          <div className="kpi-value">{mockCustomers.length}</div>
          <div className="kpi-meta">{verified} phone-verified</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Lifetime spend</span>
            <span className="kpi-ico green">💵</span>
          </div>
          <div className="kpi-value">{uzs(totalSpend)}</div>
          <div className="kpi-meta">Across all customers</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Avg. orders / customer</span>
            <span className="kpi-ico sky">📦</span>
          </div>
          <div className="kpi-value">
            {(mockCustomers.reduce((s, x) => s + x.ordersCount, 0) / mockCustomers.length).toFixed(1)}
          </div>
          <div className="kpi-meta">Rolling 30-day</div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Customers</h3>
            <div className="card-sub">{rows.length} shown</div>
          </div>
          <div className="hstack">
            <div className="hstack" style={{ gap: 6 }}>
              <button onClick={() => setFilter('ALL')} className={`btn ${filter === 'ALL' ? 'soft' : 'ghost'} sm`}>All</button>
              <button onClick={() => setFilter('VERIFIED')} className={`btn ${filter === 'VERIFIED' ? 'soft' : 'ghost'} sm`}>Verified</button>
              <button onClick={() => setFilter('UNVERIFIED')} className={`btn ${filter === 'UNVERIFIED' ? 'soft' : 'ghost'} sm`}>Unverified</button>
            </div>
            <div className="topbar-search" style={{ margin: 0, minWidth: 220 }}>
              <IconSearch size={15} />
              <input placeholder="Search name, phone..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Verified</th>
                <th style={{ textAlign: 'right' }}>Orders</th>
                <th style={{ textAlign: 'right' }}>Lifetime spend</th>
                <th style={{ textAlign: 'right' }}>Last active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="tcell-primary">
                      <span className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                        {initials(c.name)}
                      </span>
                      <strong>{c.name}</strong>
                    </div>
                  </td>
                  <td>{c.phone}</td>
                  <td>
                    <span className={`chip ${c.isVerified ? 'green' : 'gray'}`}>
                      {c.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}><strong>{c.ordersCount}</strong></td>
                  <td style={{ textAlign: 'right' }}>{uzs(c.spend)}</td>
                  <td style={{ textAlign: 'right' }} className="muted">{c.lastActive}</td>
                  <td>
                    <button className="icon-btn" style={{ width: 30, height: 30 }} aria-label="Actions">
                      <IconDots size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <div className="empty-ico">∅</div>
                      <strong>No customers match</strong>
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
