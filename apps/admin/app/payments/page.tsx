'use client';
import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/Sidebar';
const money = (n: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(n / 1000)) + 'K';

type Tx = {
  id: string; date: string; seller: string; amount: number; commission: number;
  orders: number; status: 'paid' | 'pending' | 'processing'; method: string;
};

const TRANSACTIONS: Tx[] = [
  { id: 'TX-001', date: '27 Apr, 14:32', seller: 'Toshkent Nonvoyxonasi', amount: 3_240_000, commission: 259_200, orders: 48, status: 'paid', method: 'Uzcard' },
  { id: 'TX-002', date: '27 Apr, 12:11', seller: "Samarqand Go'shti", amount: 1_870_000, commission: 149_600, orders: 31, status: 'paid', method: 'Humo' },
  { id: 'TX-003', date: '27 Apr, 10:05', seller: "Farida's Kitchen", amount: 2_510_000, commission: 200_800, orders: 39, status: 'processing', method: 'Uzcard' },
  { id: 'TX-004', date: '26 Apr, 18:45', seller: 'DonerLand', amount: 980_000, commission: 78_400, orders: 17, status: 'pending', method: 'Uzcard' },
  { id: 'TX-005', date: '26 Apr, 16:20', seller: 'Fresh Market', amount: 4_120_000, commission: 329_600, orders: 63, status: 'paid', method: 'Humo' },
  { id: 'TX-006', date: '26 Apr, 13:55', seller: 'Plov Usta', amount: 1_340_000, commission: 107_200, orders: 22, status: 'paid', method: 'Uzcard' },
  { id: 'TX-007', date: '25 Apr, 19:30', seller: 'Burger House', amount: 2_780_000, commission: 222_400, orders: 44, status: 'pending', method: 'Uzcard' },
  { id: 'TX-008', date: '25 Apr, 17:00', seller: 'Sushi Art', amount: 5_900_000, commission: 472_000, orders: 71, status: 'paid', method: 'Humo' },
];

const STATUS_COLOR: Record<string, string> = {
  paid: 'var(--success)',
  pending: 'var(--warning)',
  processing: 'var(--primary)',
};
const STATUS_BG: Record<string, string> = {
  paid: 'var(--success-light)',
  pending: 'var(--warning-light)',
  processing: 'var(--primary-50)',
};
const STATUS_LABEL: Record<string, string> = {
  paid: "To'landi",
  pending: "Kutilmoqda",
  processing: "Jarayonda",
};

const totalPaid = TRANSACTIONS.filter(t => t.status === 'paid').reduce((s, t) => s + t.amount, 0);
const totalPending = TRANSACTIONS.filter(t => t.status !== 'paid').reduce((s, t) => s + t.amount, 0);
const totalCommission = TRANSACTIONS.reduce((s, t) => s + t.commission, 0);

export default function PaymentsPage() {
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'processing'>('all');
  const [search, setSearch] = useState('');

  const list = TRANSACTIONS
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => !search || t.seller.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="layout">
      <AdminSidebar />
      <main className="main">
        <div className="page">
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>To'lovlar</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sotuvchilar bilan hisob-kitob</p>
          </div>

          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: "To'langan", value: money(totalPaid) + " so'm", color: 'var(--success)', bg: 'var(--success-light)', icon: '✅' },
              { label: "Kutilmoqda", value: money(totalPending) + " so'm", color: 'var(--warning)', bg: 'var(--warning-light)', icon: '⏳' },
              { label: "Komissiya", value: money(totalCommission) + " so'm", color: 'var(--primary)', bg: 'var(--primary-50)', icon: '💰' },
            ].map(k => (
              <div key={k.label} style={{
                background: 'var(--surface)', borderRadius: 16, padding: '20px',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: k.bg, display: 'grid', placeItems: 'center', fontSize: 18,
                  }}>
                    {k.icon}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{k.label}</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Filters row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <input
                className="input"
                placeholder="Sotuvchi nomi yoki ID bo'yicha qidirish…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, background: 'var(--surface-2)', borderRadius: 12, padding: 4 }}>
              {(['all', 'paid', 'pending', 'processing'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '7px 14px', borderRadius: 9, border: 'none',
                  background: filter === f ? '#fff' : 'transparent',
                  color: filter === f ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: filter === f ? 700 : 500, fontSize: 13,
                  cursor: 'pointer', boxShadow: filter === f ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
                  transition: 'all 200ms', whiteSpace: 'nowrap',
                }}>
                  {f === 'all' ? 'Barchasi' : STATUS_LABEL[f]}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{
            background: 'var(--surface)', borderRadius: 16,
            border: '1px solid var(--border)', overflow: 'hidden',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.4fr 1fr 0.8fr 0.8fr 0.9fr 1fr',
              padding: '12px 16px',
              background: 'var(--surface-2)',
              fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
              letterSpacing: '0.5px',
            }}>
              {['ID', 'SOTUVCHI', 'SUMMA', "KOM'YA", 'BUYURTMA', 'STATUS', 'SANA'].map(h => (
                <div key={h}>{h}</div>
              ))}
            </div>

            {list.map((tx, i) => (
              <div key={tx.id} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.4fr 1fr 0.8fr 0.8fr 0.9fr 1fr',
                padding: '14px 16px',
                borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                alignItems: 'center', fontSize: 13,
              }}>
                <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{tx.id}</div>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.seller}</div>
                <div style={{ fontWeight: 700 }}>{money(tx.amount)}</div>
                <div style={{ color: 'var(--success)', fontWeight: 600 }}>{money(tx.commission)}</div>
                <div style={{ color: 'var(--text-muted)' }}>{tx.orders} ta</div>
                <div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                    background: STATUS_BG[tx.status], color: STATUS_COLOR[tx.status],
                  }}>
                    {STATUS_LABEL[tx.status]}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{tx.date}</div>
              </div>
            ))}

            {list.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Hech narsa topilmadi
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
