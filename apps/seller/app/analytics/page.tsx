'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SellerSidebar } from '@/components/Sidebar';
import { api, money } from '@/lib/api';

type DayData = { day: string; revenue: number; orders: number };

const EMPTY_WEEK: DayData[] = [
  { day: 'Du', revenue: 0, orders: 0 },
  { day: 'Se', revenue: 0, orders: 0 },
  { day: 'Ch', revenue: 0, orders: 0 },
  { day: 'Pa', revenue: 0, orders: 0 },
  { day: 'Ju', revenue: 0, orders: 0 },
  { day: 'Sh', revenue: 0, orders: 0 },
  { day: 'Ya', revenue: 0, orders: 0 },
];

type SellerOrder = {
  id: string;
  status: string;
  totalAmount: number | string;
  createdAt: string;
};

const DOW = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

export default function AnalyticsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      if (typeof window === 'undefined') return;
      if (!localStorage.getItem('access_token')) {
        router.replace('/login');
        return;
      }
      setAuthChecked(true);
    }, 0);
    return () => clearTimeout(id);
  }, [router]);

  const load = useCallback(async () => {
    try {
      const res = await api<SellerOrder[] | { items: SellerOrder[] }>('/orders/seller');
      const list = Array.isArray(res) ? res : (res.items ?? []);
      setOrders(list);
    } catch { /* keep empty */ }
  }, []);

  useEffect(() => {
    if (authChecked) load();
  }, [authChecked, load]);

  // Aggregate last 7 days from real orders
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const last7Start = new Date(todayStart);
  last7Start.setDate(last7Start.getDate() - 6);

  const week: DayData[] = EMPTY_WEEK.map((_, i) => {
    const d = new Date(last7Start);
    d.setDate(d.getDate() + i);
    return { day: DOW[d.getDay()], revenue: 0, orders: 0 };
  });
  for (const o of orders) {
    if (o.status === 'CANCELED' || o.status === 'FAILED') continue;
    const d = new Date(o.createdAt);
    const idx = Math.floor((d.getTime() - last7Start.getTime()) / (24 * 3600 * 1000));
    if (idx >= 0 && idx < 7) {
      week[idx].revenue += Number(o.totalAmount);
      week[idx].orders += 1;
    }
  }

  const totalRevenue = week.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = week.reduce((s, d) => s + d.orders, 0);
  const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const maxBar = Math.max(1, ...week.map((d) => d.revenue));

  if (!authChecked) {
    return (
      <div className="layout">
        <SellerSidebar />
        <main className="main">
          <div className="page" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            Yuklanmoqda…
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="layout">
      <SellerSidebar />
      <main className="main">
        <div className="page">
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Tahlil</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Biznesingiz ko&apos;rsatkichlari</p>
          </div>

          <div style={{
            display: 'inline-flex', background: 'var(--surface-2)',
            borderRadius: 12, padding: 4, marginBottom: 24,
          }}>
            {(['week', 'month'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '7px 20px', borderRadius: 9, border: 'none',
                background: period === p ? '#fff' : 'transparent',
                color: period === p ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: period === p ? 700 : 500, fontSize: 14,
                cursor: 'pointer', boxShadow: period === p ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
                transition: 'all 200ms',
              }}>
                {p === 'week' ? 'Bu hafta' : 'Bu oy'}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Jami daromad', value: money(totalRevenue) + " so'm" },
              { label: 'Buyurtmalar', value: totalOrders + ' ta' },
              { label: "O'rt. buyurtma", value: money(avgOrder) + " so'm" },
            ].map(k => (
              <div key={k.label} style={{
                background: 'var(--surface)', borderRadius: 16, padding: '16px',
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.3px' }}>{k.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>oxirgi 7 kun</div>
              </div>
            ))}
          </div>

          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: 20,
            border: '1px solid var(--border)', marginBottom: 24,
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Kunlik daromad</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Oxirgi 7 kun · so&apos;m</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
              {week.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: '100%',
                    height: `${Math.max(8, (d.revenue / maxBar) * 108)}px`,
                    background: 'var(--text)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 400ms ease',
                    cursor: 'default',
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)',
                      fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap',
                    }}>
                      {d.orders}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: 20,
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Top mahsulotlar va hududlar</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {totalOrders === 0
                ? "Hozircha buyurtmalar yo'q — tahlil paydo bo'lishi uchun mijozlardan buyurtma kutilmoqda."
                : 'Tahlil keyingi versiyada qo\'shiladi.'}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
