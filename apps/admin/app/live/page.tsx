'use client';

import { useMemo, useState } from 'react';
import { LiveMap } from '@/components/admin/LiveMap';
import { StatusChip } from '@/components/admin/StatusChip';
import { IconLive, IconTruck } from '@/components/admin/Icon';
import { initials, mockCouriers, mockOrders } from '@/lib/admin-mock';

export default function AdminLivePage() {
  const liveOrders = useMemo(
    () =>
      mockOrders.filter((o) =>
        ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'COURIER_ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'].includes(o.status),
      ),
    [],
  );
  const [selected, setSelected] = useState<string>(liveOrders[0]?.id ?? '');

  return (
    <div className="stack">
      <div className="grid-2-3">
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Fleet map</h3>
              <div className="card-sub">Live positions · updates every ~1.6s</div>
            </div>
            <div className="chip indigo"><IconLive size={12} /> Live</div>
          </div>
          <LiveMap />
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>In-flight orders</h3>
              <div className="card-sub">{liveOrders.length} deliveries in progress</div>
            </div>
          </div>

          <div className="stack" style={{ gap: 10 }}>
            {liveOrders.map((o) => {
              const isSel = selected === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => setSelected(o.id)}
                  className="card"
                  style={{
                    padding: 12,
                    border: isSel ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: isSel ? 'var(--primary-50)' : 'var(--surface)',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div className="hstack" style={{ justifyContent: 'space-between' }}>
                    <strong>{o.code}</strong>
                    <StatusChip status={o.status} />
                  </div>
                  <div className="hstack" style={{ justifyContent: 'space-between', marginTop: 6 }}>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {o.customerName} · {o.sellerName}
                    </span>
                    <span className="muted" style={{ fontSize: 12 }}>{o.placedAt}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Couriers on shift</h3>
            <div className="card-sub">{mockCouriers.filter((c) => c.isOnline).length} online now</div>
          </div>
          <button className="btn ghost sm"><IconTruck size={14} /> Dispatch</button>
        </div>

        <div className="grid-3">
          {mockCouriers
            .filter((c) => c.isOnline)
            .map((c) => (
              <div key={c.id} className="card" style={{ padding: 14 }}>
                <div className="hstack" style={{ justifyContent: 'space-between' }}>
                  <div className="tcell-primary">
                    <span className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                      {initials(c.name)}
                    </span>
                    <div>
                      <strong style={{ fontSize: 13 }}>{c.name}</strong>
                      <div className="muted" style={{ fontSize: 11 }}>{c.vehicle} · {c.zone}</div>
                    </div>
                  </div>
                  <span className={`chip ${c.isBusy ? 'amber' : 'green'}`}>
                    {c.isBusy ? 'On delivery' : 'Available'}
                  </span>
                </div>
                <div className="hstack" style={{ justifyContent: 'space-between', marginTop: 10, fontSize: 12 }}>
                  <span className="muted">Deliveries today</span>
                  <strong>{c.deliveriesToday}</strong>
                </div>
                <div className="hstack" style={{ justifyContent: 'space-between', fontSize: 12, marginTop: 2 }}>
                  <span className="muted">Rating</span>
                  <span>
                    <span style={{ color: '#f59e0b' }}>★</span> {c.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
