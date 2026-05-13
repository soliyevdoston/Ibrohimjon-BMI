'use client';

import { useMemo, useState } from 'react';
import { StatusChip } from '@/components/admin/StatusChip';
import { IconSearch } from '@/components/admin/Icon';
import type { Status } from '@/lib/admin-mock';
import { useApiOrders, numFromStr } from '@/lib/admin-api';

const filters: { key: 'ALL' | Status; label: string }[] = [
  { key: 'ALL', label: 'Barchasi' },
  { key: 'PENDING', label: 'Kutilmoqda' },
  { key: 'PREPARING', label: 'Tayyorlanmoqda' },
  { key: 'READY_FOR_PICKUP', label: 'Tayyor' },
  { key: 'ON_THE_WAY', label: "Yo'lda" },
  { key: 'DELIVERED', label: 'Yetkazildi' },
  { key: 'CANCELED', label: 'Bekor qilindi' },
];

function uzs(value: number) {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' soʼm';
}

function fmtTime(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'hozir';
  if (m < 60) return `${m} daq oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  return `${Math.floor(h / 24)} kun oldin`;
}

export default function AdminOrdersPage() {
  const { items: orders, loading } = useApiOrders();
  const [filter, setFilter] = useState<(typeof filters)[number]['key']>('ALL');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    return orders.filter((o) => {
      if (filter !== 'ALL' && o.status !== filter) return false;
      if (q) {
        const needle = q.toLowerCase();
        const haystack = `${o.id} ${o.customerId} ${o.sellerId} ${o.deliveryAddressText ?? ''}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [filter, q, orders]);

  const total = rows.reduce((s, r) => s + numFromStr(r.totalAmount), 0);

  return (
    <div className="stack">
      <div className="card">
        <div className="card-h" style={{ marginBottom: 10 }}>
          <div>
            <h3>Barcha buyurtmalar</h3>
            <div className="card-sub">
              {loading ? 'yuklanmoqda…' : `${rows.length} natija · ${uzs(total)}`}
            </div>
          </div>
          <div className="hstack">
            <div className="topbar-search" style={{ margin: 0, minWidth: 220 }}>
              <IconSearch size={15} />
              <input
                placeholder="Buyurtma ID, manzil..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
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
                <th>Buyurtma</th>
                <th>Mijoz ID</th>
                <th>Sotuvchi ID</th>
                <th>Mahsulotlar</th>
                <th>Manzil</th>
                <th>To&apos;lov</th>
                <th>Holat</th>
                <th style={{ textAlign: 'right' }}>Jami</th>
                <th style={{ textAlign: 'right' }}>Vaqti</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} style={o.status === 'CANCELED' ? { opacity: 0.55 } : undefined}>
                  <td><strong>#{o.id.slice(0, 8)}</strong></td>
                  <td>
                    <code style={{ fontSize: 11 }}>{o.customerId.slice(0, 8)}</code>
                  </td>
                  <td>
                    <code style={{ fontSize: 11 }}>{o.sellerId.slice(0, 8)}</code>
                  </td>
                  <td>{o.items?.length ?? 0} ta</td>
                  <td style={{ fontSize: 12, maxWidth: 220 }}>
                    {o.deliveryAddressText ?? '—'}
                  </td>
                  <td>
                    <span className="chip gray">{o.paymentMethod}</span>{' '}
                    <span className={`chip ${o.paymentStatus === 'PAID' ? 'green' : 'amber'}`} style={{ fontSize: 10 }}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td><StatusChip status={o.status as Status} /></td>
                  <td style={{ textAlign: 'right' }}>{uzs(numFromStr(o.totalAmount))}</td>
                  <td style={{ textAlign: 'right' }} className="muted">{fmtTime(o.createdAt)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="empty">
                      <div className="empty-ico">∅</div>
                      <strong>{loading ? 'Yuklanmoqda…' : 'Buyurtmalar topilmadi'}</strong>
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
