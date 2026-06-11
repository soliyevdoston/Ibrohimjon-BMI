'use client';

import { useMemo, useState } from 'react';
import { LiveMap } from '@/components/admin/LiveMap';
import { StatusChip } from '@/components/admin/StatusChip';
import { IconLive, IconTruck } from '@/components/admin/Icon';
import { initials } from '@/lib/admin-mock';
import { useApiOrders, useApiCouriers } from '@/lib/admin-api';
import type { Status } from '@/lib/admin-mock';

const LIVE_STATUSES = ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'COURIER_ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'];

export default function AdminLivePage() {
  const { items: orders, loading: ordersLoading } = useApiOrders();
  const { items: couriers, loading: couriersLoading } = useApiCouriers();

  const liveOrders = useMemo(
    () => orders.filter((o) => LIVE_STATUSES.includes(o.status)),
    [orders],
  );

  const [selected, setSelected] = useState<string>('');
  const onlineCouriers = couriers.filter((c) => c.isOnline);

  return (
    <div className="stack">
      <div className="grid-2-3">
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Fleet xaritasi</h3>
              <div className="card-sub">Jonli kuryer joylashuvi</div>
            </div>
            <div className="chip gray"><IconLive size={12} /> Live</div>
          </div>
          <LiveMap />
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>Faol buyurtmalar</h3>
              <div className="card-sub">
                {ordersLoading ? 'yuklanmoqda…' : `${liveOrders.length} yetkazib berishda`}
              </div>
            </div>
          </div>

          <div className="stack" style={{ gap: 10 }}>
            {liveOrders.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                Hozircha faol buyurtmalar yo&apos;q
              </div>
            )}
            {liveOrders.map((o) => {
              const isSel = selected === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => setSelected(o.id)}
                  className="card"
                  style={{
                    padding: 12,
                    border: isSel ? '1px solid var(--text)' : '1px solid var(--border)',
                    background: isSel ? 'var(--surface-2)' : 'var(--surface)',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div className="hstack" style={{ justifyContent: 'space-between' }}>
                    <strong>#{o.id.slice(0, 8)}</strong>
                    <StatusChip status={o.status as Status} />
                  </div>
                  <div className="hstack" style={{ justifyContent: 'space-between', marginTop: 6 }}>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {o.customerId.slice(0, 6)} · {o.sellerId.slice(0, 6)}
                    </span>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {new Date(o.createdAt).toLocaleString('uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
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
            <h3>Smenadagi kuryerlar</h3>
            <div className="card-sub">
              {couriersLoading ? 'yuklanmoqda…' : `${onlineCouriers.length} ta onlayn`}
            </div>
          </div>
          <span className="chip green"><IconTruck size={12} /> {onlineCouriers.length}</span>
        </div>

        <div className="grid-3">
          {onlineCouriers.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
              Onlayn kuryerlar yo&apos;q
            </div>
          )}
          {onlineCouriers.map((c) => {
            const busy = !c.isAvailable;
            return (
              <div key={c.id} className="card" style={{ padding: 14 }}>
                <div className="hstack" style={{ justifyContent: 'space-between' }}>
                  <div className="tcell-primary">
                    <span className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                      {initials(c.user.fullName ?? '?')}
                    </span>
                    <div>
                      <strong style={{ fontSize: 13 }}>{c.user.fullName ?? '—'}</strong>
                      <div className="muted" style={{ fontSize: 11 }}>{c.vehicleType} · {c.vehicleModel ?? '—'}</div>
                    </div>
                  </div>
                  <span className="chip gray">
                    {busy ? 'Yetkazmoqda' : "Bo'sh"}
                  </span>
                </div>
                <div className="hstack" style={{ justifyContent: 'space-between', marginTop: 10, fontSize: 12 }}>
                  <span className="muted">Maks. yuk</span>
                  <strong>{Number(c.maxLoadKg).toFixed(0)} kg</strong>
                </div>
                <div className="hstack" style={{ justifyContent: 'space-between', fontSize: 12, marginTop: 2 }}>
                  <span className="muted">Raqam</span>
                  <span style={{ fontWeight: 600 }}>{c.vehiclePlate ?? '—'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
