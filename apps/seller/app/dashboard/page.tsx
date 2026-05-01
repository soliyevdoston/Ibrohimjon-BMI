'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SellerSidebar } from '@/components/Sidebar';
import { SellerTopbar } from '@/components/Topbar';
import { api, money } from '@/lib/api';

function useCountUp(target: number, durationMs: number = 900): number {
  const [value, setValue] = useState(0);
  const ref = useRef<{ start: number; from: number; to: number; raf: number | null }>({
    start: 0, from: 0, to: target, raf: null,
  });
  useEffect(() => {
    if (ref.current.raf) cancelAnimationFrame(ref.current.raf);
    ref.current.from = value;
    ref.current.to = target;
    ref.current.start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - ref.current.start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = ref.current.from + (ref.current.to - ref.current.from) * eased;
      setValue(t === 1 ? ref.current.to : next);
      if (t < 1) ref.current.raf = requestAnimationFrame(tick);
    };
    ref.current.raf = requestAnimationFrame(tick);
    return () => { if (ref.current.raf) cancelAnimationFrame(ref.current.raf); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);
  return value;
}

function AnimatedKpi({ label, value, formatted }: { label: string; value: number; formatted?: (v: number) => string }) {
  const animated = useCountUp(value);
  return (
    <div className="kpi">
      <div className="kpi-row">
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-value" style={{ fontSize: 26 }}>
        {formatted ? formatted(animated) : Math.round(animated).toString()}
      </div>
    </div>
  );
}

type Stats = { todayOrders: number; todayRevenue: number; activeOrders: number; totalProducts: number };
type Order = { id: string; code: string; customerName: string; status: string; totalAmount: number; createdAt: string };

const DEMO_STATS: Stats = { todayOrders: 14, todayRevenue: 1_850_000, activeOrders: 3, totalProducts: 42 };
const DEMO_ORDERS: Order[] = [
  { id: '1', code: 'ORD-001', customerName: 'Dilnoza K.', status: 'PENDING', totalAmount: 185000, createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: '2', code: 'ORD-002', customerName: 'Jamshid T.', status: 'PREPARING', totalAmount: 340000, createdAt: new Date(Date.now() - 22 * 60000).toISOString() },
  { id: '3', code: 'ORD-003', customerName: 'Zulfiya M.', status: 'ACCEPTED', totalAmount: 95000, createdAt: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: '4', code: 'ORD-004', customerName: 'Bobur N.', status: 'DELIVERED', totalAmount: 220000, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
];

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'gray', ACCEPTED: 'gray', PREPARING: 'gray',
  READY_FOR_PICKUP: 'gray', DELIVERED: 'gray', CANCELED: 'gray', FAILED: 'gray',
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const REVENUE_DATA = [120, 185, 210, 95, 340, 280, 185].map((v, i) => ({
  id: i,
  day: ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sh', 'Ya'][i],
  value: v,
}));
const MAX_REV = Math.max(...REVENUE_DATA.map((d) => d.value));

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>(DEMO_STATS);
  const [orders, setOrders] = useState<Order[]>(DEMO_ORDERS);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.replace('/login'); return; }
    const load = async () => {
      try {
        const [s, o] = await Promise.all([
          api<Partial<Stats>>('/orders/seller/dashboard', { token }),
          api<Order[] | { items?: Order[] }>('/orders/seller', { token }),
        ]);
        setStats({
          todayOrders: s.todayOrders ?? 0,
          todayRevenue: s.todayRevenue ?? 0,
          activeOrders: s.activeOrders ?? 0,
          totalProducts: s.totalProducts ?? DEMO_STATS.totalProducts,
        });
        const orderList = Array.isArray(o) ? o : (o.items ?? []);
        setOrders(orderList.slice(0, 5));
      } catch { /* use demo data */ }
    };
    load();
  }, [router]);

  return (
    <div className="app-shell">
      <SellerSidebar pendingCount={stats.activeOrders} />
      <div className="app-main">
        <SellerTopbar title="Dashboard" subtitle="Lochin · Seller" />
        <main className="app-content fade-in">
          <div className="stack">
            {/* KPI row — animated counters */}
            <div className="grid-4">
              <AnimatedKpi label="Bugungi buyurtmalar" value={stats.todayOrders} />
              <AnimatedKpi
                label="Bugungi daromad"
                value={stats.todayRevenue}
                formatted={(v) => money(v) + ' so\'m'}
              />
              <AnimatedKpi label="Faol buyurtmalar" value={stats.activeOrders} />
              <AnimatedKpi label="Mahsulotlar" value={stats.totalProducts} />
            </div>

            <div className="grid-2-3">
              {/* Revenue bar chart */}
              <div className="card">
                <div className="card-h">
                  <h3>Revenue this week</h3>
                  <span className="muted text-sm">('000 so'm)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                  {REVENUE_DATA.map((d) => (
                    <div key={d.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div
                        style={{
                          width: '100%', background: 'var(--text)',
                          height: `${(d.value / MAX_REV) * 100}px`,
                          borderRadius: '6px 6px 0 0',
                          transition: 'height 300ms ease',
                        }}
                      />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div className="card">
                <div className="card-h"><h3>Quick actions</h3></div>
                <div className="stack-sm">
                  <a href="/products" className="btn full" style={{ justifyContent: 'flex-start', gap: 10 }}>
                    Manage Products
                  </a>
                  <a href="/orders" className="btn ghost full" style={{ justifyContent: 'flex-start', gap: 10 }}>
                    View All Orders
                  </a>
                  <a href="/orders?filter=pending" className="btn ghost full" style={{ justifyContent: 'flex-start', gap: 10 }}>
                    Pending Orders ({stats.activeOrders})
                  </a>
                </div>
              </div>
            </div>

            {/* Recent orders */}
            <div className="card">
              <div className="card-h">
                <h3>Recent orders</h3>
                <a href="/orders" className="btn ghost sm">View all →</a>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td><strong>{o.code}</strong></td>
                        <td>{o.customerName}</td>
                        <td><span className={`chip ${STATUS_COLOR[o.status] ?? 'gray'}`}>{o.status.replace(/_/g, ' ')}</span></td>
                        <td><strong>{money(o.totalAmount)} so'm</strong></td>
                        <td className="muted">{timeAgo(o.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
