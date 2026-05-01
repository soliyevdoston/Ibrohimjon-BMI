'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SellerSidebar } from '@/components/Sidebar';
import { money } from '@/lib/api';

type DayData = { day: string; revenue: number; orders: number };
type TopProduct = { name: string; sold: number; revenue: number };
type AreaData = { area: string; orders: number; pct: number };

const WEEK: DayData[] = [
  { day: 'Du', revenue: 320000, orders: 14 },
  { day: 'Se', revenue: 480000, orders: 21 },
  { day: 'Ch', revenue: 290000, orders: 12 },
  { day: 'Pa', revenue: 610000, orders: 27 },
  { day: 'Ju', revenue: 870000, orders: 38 },
  { day: 'Sh', revenue: 1140000, orders: 51 },
  { day: 'Ya', revenue: 760000, orders: 34 },
];

const TOP_PRODUCTS: TopProduct[] = [
  { name: 'Non tandirdan', sold: 143, revenue: 858000 },
  { name: 'Lag\'mon', sold: 98, revenue: 1078000 },
  { name: 'Somsa', sold: 212, revenue: 636000 },
  { name: 'Shashlik', sold: 67, revenue: 1139000 },
  { name: 'Qovoqli osh', sold: 54, revenue: 918000 },
];

const AREAS: AreaData[] = [
  { area: 'Yunusobod', orders: 87, pct: 28 },
  { area: 'Chilonzor', orders: 72, pct: 23 },
  { area: 'Mirzo Ulugbek', orders: 58, pct: 19 },
  { area: 'Shayxontohur', orders: 51, pct: 16 },
  { area: 'Boshqalar', orders: 43, pct: 14 },
];

const AREA_SHADES = ['var(--text)', '#525252', '#737373', '#a3a3a3', '#d4d4d4'];

const totalRevenue = WEEK.reduce((s, d) => s + d.revenue, 0);
const totalOrders = WEEK.reduce((s, d) => s + d.orders, 0);
const avgOrder = Math.round(totalRevenue / totalOrders);
const maxBar = Math.max(...WEEK.map(d => d.revenue));

export default function AnalyticsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    // Defer to next tick so any pending localStorage writes settle first
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
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Tahlil</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Biznesingiz ko'rsatkichlari</p>
          </div>

          {/* Period tabs */}
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

          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Jami daromad', value: money(totalRevenue) + " so'm", delta: '+12%' },
              { label: 'Buyurtmalar', value: totalOrders + ' ta', delta: '+8%' },
              { label: "O'rt. buyurtma", value: money(avgOrder) + " so'm", delta: '+4%' },
            ].map(k => (
              <div key={k.label} style={{
                background: 'var(--surface)', borderRadius: 16, padding: '16px',
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.3px' }}>{k.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{k.delta} o'tgan haftaga nisbatan</div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: 20,
            border: '1px solid var(--border)', marginBottom: 24,
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Kunlik daromad</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Oxirgi 7 kun · so'm</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
              {WEEK.map(d => (
                <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {/* Top products */}
            <div style={{
              background: 'var(--surface)', borderRadius: 16, padding: 20,
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Top mahsulotlar</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {TOP_PRODUCTS.map((p, i) => (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 7, background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800,
                      color: 'var(--text)', flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.sold} ta sotildi</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>
                      {money(p.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Area breakdown */}
            <div style={{
              background: 'var(--surface)', borderRadius: 16, padding: 20,
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Hududlar bo'yicha</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {AREAS.map((a, i) => (
                  <div key={a.area}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{a.area}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.orders} ta ({a.pct}%)</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <div style={{
                        height: '100%', width: `${a.pct}%`,
                        background: AREA_SHADES[i], borderRadius: 3,
                        transition: 'width 600ms ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Conversion rate */}
          <div style={{
            background: 'var(--text)',
            borderRadius: 16, padding: 20, color: 'var(--surface)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Konversiya ko'rsatkichlari</div>
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { label: 'Ko\'rganlar', value: '1,248' },
                { label: 'Savatga soldi', value: '387' },
                { label: 'Buyurtma berdi', value: totalOrders.toString() },
                { label: 'Konversiya', value: ((totalOrders / 1248) * 100).toFixed(1) + '%' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--surface)', letterSpacing: '-0.5px' }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
