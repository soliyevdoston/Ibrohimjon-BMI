'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SellerSidebar } from '@/components/Sidebar';
import { SellerTopbar } from '@/components/Topbar';
import { api, money } from '@/lib/api';

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
  PENDING: 'amber', ACCEPTED: 'sky', PREPARING: 'indigo',
  READY_FOR_PICKUP: 'green', DELIVERED: 'green', CANCELED: 'rose', FAILED: 'rose',
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const REVENUE_DATA = [120, 185, 210, 95, 340, 280, 185].map((v, i) => ({ day: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i], value: v }));
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
          api<Stats>('/sellers/dashboard', { token }),
          api<{ items: Order[] }>('/sellers/orders?limit=5', { token }),
        ]);
        setStats(s);
        setOrders(o.items);
      } catch { /* use demo data */ }
    };
    load();
  }, [router]);

  const KPI_CARDS = [
    { label: 'Orders today', value: stats.todayOrders, icon: '📋', color: 'indigo' },
    { label: 'Revenue today', value: money(stats.todayRevenue) + ' so\'m', icon: '💰', color: 'green' },
    { label: 'Active orders', value: stats.activeOrders, icon: '🔄', color: 'amber' },
    { label: 'Total products', value: stats.totalProducts, icon: '📦', color: 'sky' },
  ];

  return (
    <div className="app-shell">
      <SellerSidebar pendingCount={stats.activeOrders} />
      <div className="app-main">
        <SellerTopbar title="Dashboard" subtitle="Lochin · Seller" />
        <main className="app-content fade-in">
          <div className="stack">
            {/* KPI row */}
            <div className="grid-4">
              {KPI_CARDS.map((k) => (
                <div key={k.label} className="kpi">
                  <div className="kpi-row">
                    <span className="kpi-label">{k.label}</span>
                    <span className={`kpi-ico ${k.color}`}>{k.icon}</span>
                  </div>
                  <div className="kpi-value" style={{ fontSize: typeof k.value === 'string' ? 18 : 26 }}>
                    {k.value}
                  </div>
                </div>
              ))}
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
                    <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div
                        style={{
                          width: '100%', background: 'var(--primary)',
                          height: `${(d.value / MAX_REV) * 100}px`,
                          borderRadius: '6px 6px 0 0', opacity: 0.85,
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
                    <span>📦</span> Manage Products
                  </a>
                  <a href="/orders" className="btn ghost full" style={{ justifyContent: 'flex-start', gap: 10 }}>
                    <span>🛒</span> View All Orders
                  </a>
                  <a href="/orders?filter=pending" className="btn warning full" style={{ justifyContent: 'flex-start', gap: 10 }}>
                    <span>⏰</span> Pending Orders ({stats.activeOrders})
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
