'use client';

import { useMemo, useState } from 'react';
import { StatusChip } from '@/components/admin/StatusChip';
import { IconClose, IconSearch } from '@/components/admin/Icon';
import { initials, uzs } from '@/lib/admin-mock';
import type { Status } from '@/lib/admin-mock';
import { useOrders } from '@/lib/admin-store';

const filters: { key: 'ALL' | Status; label: string }[] = [
  { key: 'ALL', label: 'Barchasi' },
  { key: 'PENDING', label: 'Kutilmoqda' },
  { key: 'PREPARING', label: 'Tayyorlanmoqda' },
  { key: 'READY_FOR_PICKUP', label: 'Tayyor' },
  { key: 'ON_THE_WAY', label: "Yo'lda" },
  { key: 'DELIVERED', label: 'Yetkazildi' },
  { key: 'CANCELED', label: 'Bekor qilindi' },
];

const STATUS_OPTIONS: Status[] = [
  'PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP',
  'COURIER_ACCEPTED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED',
  'CANCELED', 'FAILED',
];

export default function AdminOrdersPage() {
  const { items: orders, update, remove } = useOrders();
  const [filter, setFilter] = useState<(typeof filters)[number]['key']>('ALL');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    return orders.filter((o) => {
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
  }, [filter, q, orders]);

  const total = rows.reduce((s, r) => s + r.total, 0);

  const handleCancel = (id: string, code: string) => {
    if (confirm(`${code} buyurtmani bekor qilishni xohlaysizmi?`)) {
      update(id, { status: 'CANCELED' });
    }
  };

  const handleDelete = (id: string, code: string) => {
    if (confirm(`${code} buyurtmani butunlay o'chirishni xohlaysizmi?`)) remove(id);
  };

  return (
    <div className="stack">
      <div className="card">
        <div className="card-h" style={{ marginBottom: 10 }}>
          <div>
            <h3>Barcha buyurtmalar</h3>
            <div className="card-sub">{rows.length} natija · {uzs(total)}</div>
          </div>
          <div className="hstack">
            <div className="topbar-search" style={{ margin: 0, minWidth: 220 }}>
              <IconSearch size={15} />
              <input
                placeholder="Buyurtma, mijoz, sotuvchi..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button className="btn ghost sm">Eksport</button>
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
                <th>Mijoz</th>
                <th>Sotuvchi</th>
                <th>Kuryer</th>
                <th>Shahar</th>
                <th>Holat (o'zgartirish)</th>
                <th style={{ textAlign: 'right' }}>Jami</th>
                <th style={{ textAlign: 'right' }}>Vaqti</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} style={o.status === 'CANCELED' ? { opacity: 0.55 } : undefined}>
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
                  <td>{o.courierName ?? <span className="muted">— belgilanmagan</span>}</td>
                  <td>{o.city}</td>
                  <td>
                    <div className="hstack" style={{ gap: 6, alignItems: 'center' }}>
                      <StatusChip status={o.status} />
                      <select
                        value={o.status}
                        onChange={(e) => update(o.id, { status: e.target.value as Status })}
                        style={{
                          padding: '4px 6px',
                          fontSize: 11,
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                          background: 'var(--surface)',
                          cursor: 'pointer',
                        }}
                        aria-label="Holatni o'zgartirish"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>{uzs(o.total)}</td>
                  <td style={{ textAlign: 'right' }} className="muted">{o.placedAt}</td>
                  <td>
                    <div className="hstack" style={{ gap: 4, justifyContent: 'flex-end' }}>
                      {o.status !== 'CANCELED' && o.status !== 'DELIVERED' && (
                        <button
                          className="btn ghost sm"
                          onClick={() => handleCancel(o.id, o.code)}
                          style={{ color: '#ef4444' }}
                        >
                          Bekor qilish
                        </button>
                      )}
                      <button
                        className="icon-btn"
                        style={{ width: 30, height: 30, color: '#ef4444' }}
                        onClick={() => handleDelete(o.id, o.code)}
                        aria-label="O'chirish"
                      >
                        <IconClose size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="empty">
                      <div className="empty-ico">∅</div>
                      <strong>Buyurtmalar topilmadi</strong>
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
