'use client';

import Link from 'next/link';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { DonutChart } from '@/components/admin/DonutChart';
import { KpiCard } from '@/components/admin/KpiCard';
import { LiveMap } from '@/components/admin/LiveMap';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { StatusChip } from '@/components/admin/StatusChip';
import {
  IconChart,
  IconLive,
  IconMoney,
  IconOrders,
  IconTruck,
} from '@/components/admin/Icon';
import { initials } from '@/lib/admin-mock';
import { useAdminStats, useApiOrders, numFromStr } from '@/lib/admin-api';

function shortAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function uzs(value: number) {
  const formatted = String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return formatted + ' soʼm';
}

export default function DashboardPage() {
  const { data: stats, loading } = useAdminStats();
  const { items: orders } = useApiOrders();

  const kpis = stats?.kpis;
  const revenueByHour = stats?.revenueByHour ?? [];
  const topSellers = stats?.topSellers ?? [];

  const STATUS_COLORS: Record<string, string> = {
    DELIVERED:        '#0f172a',
    ON_THE_WAY:       '#374151',
    PICKED_UP:        '#4b5563',
    COURIER_ACCEPTED: '#52525b',
    READY_FOR_PICKUP: '#6b7280',
    PREPARING:        '#9ca3af',
    ACCEPTED:         '#a3a3a3',
    PENDING:          '#d4d4d8',
    CANCELED:         '#e5e7eb',
    FAILED:           '#fca5a5',
  };
  const statusSegments = (stats?.statusDistribution ?? []).map((s) => ({
    label: s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] ?? '#9ca3af',
  }));

  const latestOrders = orders.slice(0, 6);

  return (
    <div className="stack">
      <div className="grid-4">
        <KpiCard
          label="Revenue today"
          value={uzs(kpis?.revenueToday ?? 0)}
          delta={kpis?.revenueDelta ?? 0}
          hint={loading ? 'loading…' : 'vs. yesterday'}
          tone="indigo"
          icon={IconMoney}
          trendData={revenueByHour.map((r) => r.v)}
        />
        <KpiCard
          label="Orders"
          value={String(kpis?.ordersToday ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
          delta={kpis?.ordersDelta ?? 0}
          hint="since midnight"
          tone="sky"
          icon={IconOrders}
          trendData={revenueByHour.map((r) => r.v)}
        />
        <KpiCard
          label="Active deliveries"
          value={String(kpis?.activeDeliveries ?? 0)}
          delta={kpis?.activeDelta ?? 0}
          hint="in progress"
          tone="amber"
          icon={IconLive}
          trendData={[]}
        />
        <KpiCard
          label="Couriers online"
          value={String(kpis?.onlineCouriers ?? 0)}
          delta={kpis?.couriersDelta ?? 0}
          hint={`${kpis?.busyCouriers ?? 0} on delivery`}
          tone="green"
          icon={IconTruck}
          trendData={[]}
        />
      </div>

      <div className="grid-2-3">
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Revenue today</h3>
              <div className="card-sub">Hourly breakdown · soʼm</div>
            </div>
          </div>
          <RevenueChart points={revenueByHour} />
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>Live deliveries</h3>
              <div className="card-sub">Real-time courier positions</div>
            </div>
            <Link className="btn ghost sm" href="/live">Expand</Link>
          </div>
          <LiveMap />
        </div>
      </div>

      <div className="grid-2-3">
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Recent orders</h3>
              <div className="card-sub">Latest customer activity</div>
            </div>
            <Link className="btn ghost sm" href="/orders">View all</Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Seller</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>Placed</th>
                </tr>
              </thead>
              <tbody>
                {latestOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      Hozircha buyurtmalar yo'q
                    </td>
                  </tr>
                )}
                {latestOrders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>#{o.id.slice(0, 8)}</strong></td>
                    <td>
                      <div className="tcell-primary">
                        <span className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                          {initials(o.customerId.slice(0, 6))}
                        </span>
                        <div>
                          <strong>{o.customerId.slice(0, 8)}</strong>
                        </div>
                      </div>
                    </td>
                    <td>{o.sellerId.slice(0, 8)}</td>
                    <td><StatusChip status={o.status as never} /></td>
                    <td style={{ textAlign: 'right' }}>{uzs(numFromStr(o.totalAmount))}</td>
                    <td style={{ textAlign: 'right' }} className="muted">{shortAgo(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stack">
          <ActivityFeed height={300} />

          <div className="card">
            <div className="card-h">
              <div>
                <h3>Orders by status</h3>
                <div className="card-sub">Last 24 hours</div>
              </div>
              <IconChart size={16} />
            </div>
            {statusSegments.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                Ma'lumot yo'q
              </div>
            ) : (
              <DonutChart segments={statusSegments} centerLabel="Orders" />
            )}
          </div>

          <div className="card">
            <div className="card-h">
              <div>
                <h3>Top sellers</h3>
                <div className="card-sub">By revenue today</div>
              </div>
            </div>
            <div className="stack" style={{ gap: 12 }}>
              {topSellers.length === 0 && (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Sotuvchilar yo'q
                </div>
              )}
              {topSellers.map((s, i) => {
                const max = topSellers[0]?.revenueToday || 1;
                const pct = Math.round((s.revenueToday / max) * 100);
                return (
                  <div key={s.id}>
                    <div className="hstack" style={{ justifyContent: 'space-between' }}>
                      <div className="hstack">
                        <span className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                          {i + 1}
                        </span>
                        <div>
                          <strong style={{ fontSize: 13 }}>{s.brand}</strong>
                          <div className="muted" style={{ fontSize: 11 }}>{s.owner}</div>
                        </div>
                      </div>
                      <strong style={{ fontSize: 13 }}>{uzs(s.revenueToday)}</strong>
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        height: 6,
                        background: 'var(--surface-2)',
                        borderRadius: 999,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: 'var(--text)',
                          transition: 'width 400ms ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
