'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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
  mockCouriers,
  mockKPIs,
  mockOrders,
  mockRevenueByHour,
  mockSellers,
  uzs,
} from '@/lib/admin-mock';
import { api } from '@/lib/api';

type ApiDashboard = { activeOrders: number; activeDeliveries: number };

export default function AdminDashboardPage() {
  const [live, setLive] = useState<ApiDashboard | null>(null);

  useEffect(() => {
    api<ApiDashboard>('/admin/dashboard')
      .then(setLive)
      .catch(() => setLive(null));
  }, []);

  const activeOrders = live?.activeOrders ?? mockKPIs.ordersToday;
  const activeDeliveries = live?.activeDeliveries ?? mockKPIs.activeDeliveries;

  const busyCouriers = mockCouriers.filter((c) => c.isBusy).length;
  const topSellers = [...mockSellers].sort((a, b) => b.revenueToday - a.revenueToday).slice(0, 5);
  const latestOrders = mockOrders.slice(0, 6);

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
        />
        <KpiCard
          label="Orders"
          value={activeOrders.toLocaleString('uz-UZ')}
          delta={mockKPIs.ordersDelta}
          hint="since midnight"
          tone="sky"
          icon={IconOrders}
        />
        <KpiCard
          label="Active deliveries"
          value={activeDeliveries.toLocaleString('uz-UZ')}
          delta={mockKPIs.activeDelta}
          hint="in progress"
          tone="amber"
          icon={IconLive}
        />
        <KpiCard
          label="Couriers online"
          value={`${mockKPIs.onlineCouriers}`}
          delta={mockKPIs.couriersDelta}
          hint={`${busyCouriers} on delivery`}
          tone="green"
          icon={IconTruck}
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
              <button className="btn ghost sm">Today</button>
              <button className="btn soft sm">7 days</button>
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
            <Link className="btn ghost sm" href="/admin/live">Expand</Link>
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
            <Link className="btn ghost sm" href="/admin/orders">View all</Link>
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

        <div className="card">
          <div className="card-h">
            <div>
              <h3>Top sellers</h3>
              <div className="card-sub">By revenue today</div>
            </div>
            <IconChart size={16} />
          </div>

          <div className="stack" style={{ gap: 12 }}>
            {topSellers.map((s, i) => {
              const max = topSellers[0].revenueToday || 1;
              const pct = Math.round((s.revenueToday / max) * 100);
              return (
                <div key={s.id}>
                  <div className="hstack" style={{ justifyContent: 'space-between' }}>
                    <div className="hstack">
                      <span
                        className="avatar"
                        style={{ width: 28, height: 28, fontSize: 11 }}
                      >
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
                        background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
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
  );
}
