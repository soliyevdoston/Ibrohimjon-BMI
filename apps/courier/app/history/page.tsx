'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CourierBottomNav } from '@/components/BottomNav';
import { IconCheck, IconX, IconStore, IconMapPin, IconClock } from '@/components/Icons';
import { api, money } from '@/lib/api';

type DeliveryStatus = 'DELIVERED' | 'FAILED' | 'CANCELED' | 'ACCEPTED' | 'PICKED_UP' | 'ON_THE_WAY' | 'SEARCHING_COURIER';

type ApiDelivery = {
  id: string;
  status: DeliveryStatus;
  distanceKm: number | string | null;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  order?: {
    id: string;
    deliveryAddressText: string;
    courierFeeAmount: number | string;
    seller?: { brandName: string };
  };
};

export default function HistoryPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'delivered' | 'cancelled'>('all');
  const [items, setItems] = useState<ApiDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<ApiDelivery[] | { items: ApiDelivery[] }>('/courier/profile/history').catch(() =>
        api<ApiDelivery[] | { items: ApiDelivery[] }>('/courier/deliveries'),
      );
      const list = Array.isArray(res) ? res : (res?.items ?? []);
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { router.replace('/login'); return; }
    load();
  }, [router, load]);

  const isDelivered = (s: DeliveryStatus) => s === 'DELIVERED';
  const isCancelled = (s: DeliveryStatus) => s === 'CANCELED' || s === 'FAILED';

  const list = items.filter((d) => {
    if (filter === 'delivered') return isDelivered(d.status);
    if (filter === 'cancelled') return isCancelled(d.status);
    return isDelivered(d.status) || isCancelled(d.status);
  });

  const deliveredItems = items.filter((d) => isDelivered(d.status));
  const totalDeliveries = deliveredItems.length;
  const totalEarnings = deliveredItems.reduce(
    (s, d) => s + Number(d.order?.courierFeeAmount ?? 0),
    0,
  );
  const avgDistance = items.length > 0
    ? (items.reduce((s, d) => s + Number(d.distanceKm ?? 0), 0) / items.length).toFixed(1)
    : '0.0';

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100dvh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '32px 20px 20px',
        paddingTop: 'max(32px, calc(env(safe-area-inset-top) + 16px))',
      }}>
        <h1 style={{ color: 'var(--text)', fontSize: 22, fontWeight: 800, marginBottom: 18, letterSpacing: '-0.3px' }}>
          Yetkazishlar tarixi
        </h1>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Jami', value: totalDeliveries + ' ta' },
            { label: 'Daromad', value: money(totalEarnings) + " so'm" },
            { label: "O'rt. masofa", value: avgDistance + ' km' },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: 'var(--surface-2)', borderRadius: 12,
              padding: '12px 10px', textAlign: 'center', border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, background: 'var(--surface-2)', borderRadius: 12, padding: 4 }}>
          {([['all', 'Barchasi'], ['delivered', 'Yetkazildi'], ['cancelled', 'Bekor']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              flex: 1, padding: '8px 0', borderRadius: 9, border: 'none',
              background: filter === k ? '#fff' : 'transparent',
              color: filter === k ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: filter === k ? 700 : 500, fontSize: 13, cursor: 'pointer',
              boxShadow: filter === k ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
              transition: 'all 200ms',
            }}>
              {l}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((d) => {
            const delivered = isDelivered(d.status);
            const durationMin = d.deliveredAt && d.acceptedAt
              ? Math.round((new Date(d.deliveredAt).getTime() - new Date(d.acceptedAt).getTime()) / 60000)
              : null;
            return (
              <div key={d.id} style={{
                background: 'var(--surface)', borderRadius: 16, padding: '14px 16px',
                border: '1px solid var(--border)',
                opacity: delivered ? 1 : 0.65,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      display: 'grid', placeItems: 'center',
                      color: delivered ? 'var(--text)' : 'var(--text-muted)',
                    }}>
                      {delivered ? <IconCheck size={16} stroke={2.2} /> : <IconX size={16} stroke={2.2} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>
                        #{(d.order?.id ?? d.id).slice(0, 8).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(d.deliveredAt ?? d.createdAt).toLocaleString('uz-UZ')}
                      </div>
                    </div>
                  </div>
                  {delivered && (
                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>
                      +{money(Number(d.order?.courierFeeAmount ?? 0))} so&apos;m
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <IconStore size={14} stroke={1.8} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{d.order?.seller?.brandName ?? '—'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', paddingTop: 6, borderTop: '1px solid var(--border)', marginTop: 4, alignItems: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <IconMapPin size={12} stroke={1.8} /> {Number(d.distanceKm ?? 0).toFixed(1)} km
                    </span>
                    {durationMin !== null && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <IconClock size={12} stroke={1.8} /> {durationMin} daq
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {list.length === 0 && (
            <div style={{
              background: 'var(--surface)', borderRadius: 14, padding: '40px 16px',
              border: '1px solid var(--border)', textAlign: 'center',
              color: 'var(--text-muted)', fontSize: 13,
            }}>
              {loading ? 'Yuklanmoqda…' : "Hozircha yetkazib berishlar yo'q"}
            </div>
          )}
        </div>
      </div>

      <CourierBottomNav />
    </div>
  );
}
