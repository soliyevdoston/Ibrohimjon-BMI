'use client';

import { DonutChart } from '@/components/admin/DonutChart';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { useAdminStats } from '@/lib/admin-api';

function uzs(value: number) {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' soʼm';
}

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

export default function AdminAnalyticsPage() {
  const { data: stats, loading } = useAdminStats();

  const topSellers = stats?.topSellers ?? [];
  const statusSegments = (stats?.statusDistribution ?? []).map((s) => ({
    label: s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] ?? '#9ca3af',
  }));
  const total = statusSegments.reduce((s, x) => s + x.value, 0);

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Bu oygi tushum</span>
          </div>
          <div className="kpi-value">{uzs(stats?.revenueMonth ?? 0)}</div>
          <div className="kpi-meta">{loading ? 'yuklanmoqda…' : 'oy boshidan hozirgacha'}</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Mijozlar</span>
          </div>
          <div className="kpi-value">{stats?.totals.customers ?? 0}</div>
          <div className="kpi-meta">Ro&apos;yxatdan o&apos;tgan</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">O&apos;rtacha yetkazib berish</span>
          </div>
          <div className="kpi-value">{stats?.avgDeliveryMinutes ?? 0} min</div>
          <div className="kpi-meta">Qabuldan yetkazishgacha</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Tushum · oxirgi 7 kun</h3>
              <div className="card-sub">soʼm</div>
            </div>
          </div>
          <RevenueChart points={stats?.revenueByDay ?? []} />
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>Bugun — soatma-soat</h3>
              <div className="card-sub">soʼm</div>
            </div>
          </div>
          <RevenueChart points={stats?.revenueByHour ?? []} />
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Buyurtmalar holati</h3>
              <div className="card-sub">Oxirgi 24 soat · {total} jami</div>
            </div>
          </div>
          {statusSegments.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
              Ma&apos;lumot yo&apos;q
            </div>
          ) : (
            <DonutChart segments={statusSegments} centerLabel="Buyurtmalar" />
          )}
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>Top 5 sotuvchi · bugungi tushum</h3>
              <div className="card-sub">Reyting bo&apos;yicha</div>
            </div>
          </div>
          <div className="stack" style={{ gap: 10 }}>
            {topSellers.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>
                Hozircha sotuvchi yo&apos;q
              </div>
            )}
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
                    <div className="muted" style={{ fontSize: 11 }}>{s.ordersToday} buyurtma</div>
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
