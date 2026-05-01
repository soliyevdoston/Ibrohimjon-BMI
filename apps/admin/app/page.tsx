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
import {
  initials,
  kpiTrends,
  mockCouriers,
  mockKPIs,
  mockOrders,
  mockRevenueByHour,
  mockSellers,
  uzs,
} from '@/lib/admin-mock';

export default function DashboardPage() {
  const busyCouriers = mockCouriers.filter((c) => c.isBusy).length;
  const topSellers = [...mockSellers].sort((a, b) => b.revenueToday - a.revenueToday).slice(0, 5);
  const latestOrders = mockOrders.slice(0, 6);

  const statusSegments = [
    { label: 'Delivered',   value: 186, color: '#0f172a' },
    { label: 'On the way',  value: 37,  color: '#374151' },
    { label: 'Preparing',   value: 18,  color: '#6b7280' },
    { label: 'Pending',     value: 4,   color: '#9ca3af' },
    { label: 'Canceled',    value: 3,   color: '#d1d5db' },
  ];

  return (
    <div className="stack">
      <div className="grid-4">
        <KpiCard
          label="Revenue today"
          value={uzs(mockKPIs.revenueToday)}
          delta={mockKPIs.revenueDelta}
          hint="vs. yesterday"
          tone="indigo"
          icon={IconMoney}
          trendData={kpiTrends.revenue}
        />
        <KpiCard
          label="Orders"
          value={String(mockKPIs.ordersToday).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
          delta={mockKPIs.ordersDelta}
          hint="since midnight"
          tone="sky"
          icon={IconOrders}
          trendData={kpiTrends.orders}
        />
        <KpiCard
          label="Active deliveries"
          value={String(mockKPIs.activeDeliveries).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
          delta={mockKPIs.activeDelta}
          hint="in progress"
          tone="amber"
          icon={IconLive}
          trendData={kpiTrends.active}
        />
        <KpiCard
          label="Couriers online"
          value={`${mockKPIs.onlineCouriers}`}
          delta={mockKPIs.couriersDelta}
          hint={`${busyCouriers} on delivery`}
          tone="green"
          icon={IconTruck}
          trendData={kpiTrends.couriers}
        />
      </div>

      <div className="grid-2-3">
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Revenue today</h3>
              <div className="card-sub">Hourly breakdown · millions soʼm</div>
            </div>
            <div className="hstack" style={{ gap: 6 }}>
              <button className="btn soft sm">Today</button>
              <button className="btn ghost sm">7 days</button>
              <button className="btn ghost sm">30 days</button>
            </div>
          </div>
          <RevenueChart points={mockRevenueByHour} />
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
                {latestOrders.map((o) => (
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
                    <td><StatusChip status={o.status} /></td>
                    <td style={{ textAlign: 'right' }}>{uzs(o.total)}</td>
                    <td style={{ textAlign: 'right' }} className="muted">{o.placedAt}</td>
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
            <DonutChart segments={statusSegments} centerLabel="Orders" />
          </div>

          <div className="card">
            <div className="card-h">
              <div>
                <h3>Top sellers</h3>
                <div className="card-sub">By revenue today</div>
              </div>
            </div>
            <div className="stack" style={{ gap: 12 }}>
              {topSellers.map((s, i) => {
                const max = topSellers[0].revenueToday || 1;
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
