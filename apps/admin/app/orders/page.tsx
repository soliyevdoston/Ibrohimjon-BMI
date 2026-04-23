'use client';

import { useMemo, useState } from 'react';
import { StatusChip } from '@/components/admin/StatusChip';
import { IconDots, IconSearch } from '@/components/admin/Icon';
import { initials, mockOrders, Status, uzs } from '@/lib/admin-mock';

const filters: { key: 'ALL' | Status; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'READY_FOR_PICKUP', label: 'Ready' },
  { key: 'ON_THE_WAY', label: 'On the way' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELED', label: 'Canceled' },
];

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]['key']>('ALL');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    return mockOrders.filter((o) => {
      if (filter !== 'ALL' && o.status !== filter) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (
          !o.code.toLowerCase().includes(needle) &&
          !o.customerName.toLowerCase().includes(needle) &&
          !o.sellerName.toLowerCase().includes(needle)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [filter, q]);

  const total = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div className="stack">
      <div className="card">
        <div className="card-h" style={{ marginBottom: 10 }}>
          <div>
            <h3>All orders</h3>
            <div className="card-sub">{rows.length} results · {uzs(total)}</div>
          </div>
          <div className="hstack">
            <div className="topbar-search" style={{ margin: 0, minWidth: 220 }}>
              <IconSearch size={15} />
              <input
                placeholder="Search order, customer, seller..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button className="btn ghost sm">Export</button>
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
                <th>Order</th>
                <th>Customer</th>
                <th>Seller</th>
                <th>Courier</th>
                <th>City</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Placed</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td><strong>{o.code}</strong></td>
                  <td>
                    <div className="tcell-primary">
                      <span className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                        {initials(o.customerName)}
                      </span>
                      <div>
                        <strong>{o.customerName}</strong>
                        <div className="muted" style={{ fontSize: 12 }}>{o.customerPhone}</div>
                      </div>
                    </div>
                  </td>
                  <td>{o.sellerName}</td>
                  <td>{o.courierName ?? <span className="muted">— unassigned</span>}</td>
                  <td>{o.city}</td>
                  <td><StatusChip status={o.status} /></td>
                  <td style={{ textAlign: 'right' }}>{uzs(o.total)}</td>
                  <td style={{ textAlign: 'right' }} className="muted">{o.placedAt}</td>
                  <td>
                    <button className="icon-btn" style={{ width: 30, height: 30 }} aria-label="Actions">
                      <IconDots size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="empty">
                      <div className="empty-ico">∅</div>
                      <strong>No orders match these filters</strong>
                      <p style={{ marginTop: 4 }}>Try clearing the search or picking a different status.</p>
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
