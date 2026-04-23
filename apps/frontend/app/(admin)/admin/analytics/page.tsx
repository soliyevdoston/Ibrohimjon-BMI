'use client';

import { RevenueChart } from '@/components/admin/RevenueChart';
import { mockKPIs, mockRevenueByHour, mockSellers, uzs } from '@/lib/admin-mock';

const daily = [
  { h: 'Mon', v: 2.1 },
  { h: 'Tue', v: 3.4 },
  { h: 'Wed', v: 2.9 },
  { h: 'Thu', v: 4.2 },
  { h: 'Fri', v: 5.1 },
  { h: 'Sat', v: 6.8 },
  { h: 'Sun', v: 6.2 },
];

export default function AdminAnalyticsPage() {
  const topSellers = [...mockSellers].sort((a, b) => b.revenueToday - a.revenueToday).slice(0, 5);
  const ordersByStatus = [
    { label: 'Delivered',  value: 186, tone: 'green' as const },
    { label: 'On the way', value: 37,  tone: 'indigo' as const },
    { label: 'Preparing',  value: 18,  tone: 'amber' as const },
    { label: 'Pending',    value: 4,   tone: 'gray' as const },
    { label: 'Canceled',   value: 3,   tone: 'rose' as const },
  ];
  const total = ordersByStatus.reduce((s, x) => s + x.value, 0);

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Revenue MTD</span>
            <span className="kpi-ico indigo">💳</span>
          </div>
          <div className="kpi-value">{uzs(mockKPIs.revenueToday * 14)}</div>
          <div className="kpi-meta">April 1 → today</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Conversion rate</span>
            <span className="kpi-ico green">📈</span>
          </div>
          <div className="kpi-value">7.8%</div>
          <div className="kpi-meta">Visitors → orders</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Avg. delivery time</span>
            <span className="kpi-ico amber">⏱</span>
          </div>
          <div className="kpi-value">28 min</div>
          <div className="kpi-meta">From accept to drop-off</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Revenue · last 7 days</h3>
              <div className="card-sub">Millions soʼm</div>
            </div>
          </div>
          <RevenueChart points={daily} />
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>Today — revenue by hour</h3>
              <div className="card-sub">Millions soʼm</div>
            </div>
          </div>
          <RevenueChart points={mockRevenueByHour} />
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Orders by status</h3>
              <div className="card-sub">Last 24 hours · {total} total</div>
            </div>
          </div>
          <div className="stack" style={{ gap: 10 }}>
            {ordersByStatus.map((s) => {
              const pct = Math.round((s.value / total) * 100);
              return (
                <div key={s.label}>
                  <div className="hstack" style={{ justifyContent: 'space-between', fontSize: 13 }}>
                    <span className={`chip ${s.tone}`}>{s.label}</span>
                    <strong>{s.value} · {pct}%</strong>
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

        <div className="card">
          <div className="card-h">
            <div>
              <h3>Top 5 sellers · revenue today</h3>
              <div className="card-sub">Ranked</div>
            </div>
          </div>
          <div className="stack" style={{ gap: 10 }}>
            {topSellers.map((s, i) => (
              <div
                key={s.id}
                className="hstack"
                style={{ justifyContent: 'space-between', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 12 }}
              >
                <div className="hstack">
                  <span className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{i + 1}</span>
                  <div>
                    <strong style={{ fontSize: 13 }}>{s.brand}</strong>
                    <div className="muted" style={{ fontSize: 11 }}>{s.ordersToday} orders</div>
                  </div>
                </div>
                <strong>{uzs(s.revenueToday)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
