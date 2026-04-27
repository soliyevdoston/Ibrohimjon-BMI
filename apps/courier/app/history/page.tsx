'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CourierBottomNav } from '@/components/BottomNav';
import { IconCheck, IconX, IconStore, IconMapPin, IconClock } from '@/components/Icons';
import { money } from '@/lib/api';

type Delivery = {
  id: string; code: string; sellerName: string; customerArea: string;
  distanceKm: number; durationMin: number; earnings: number;
  date: string; status: 'delivered' | 'cancelled';
};

const DEMO: Delivery[] = [
  { id: 'd1', code: 'ORD-128', sellerName: 'Toshkent Nonvoyxonasi', customerArea: 'Chilonzor', distanceKm: 3.2, durationMin: 18, earnings: 18000, date: '27 Apr, 14:32', status: 'delivered' },
  { id: 'd2', code: 'ORD-127', sellerName: 'Samarqand Go\'shti', customerArea: 'Yunusobod', distanceKm: 5.1, durationMin: 27, earnings: 22000, date: '27 Apr, 12:11', status: 'delivered' },
  { id: 'd3', code: 'ORD-126', sellerName: 'Farida\'s Kitchen', customerArea: 'Mirzo Ulugbek', distanceKm: 4.8, durationMin: 24, earnings: 15000, date: '27 Apr, 10:05', status: 'delivered' },
  { id: 'd4', code: 'ORD-125', sellerName: 'DonerLand', customerArea: 'Shayxontohur', distanceKm: 6.3, durationMin: 33, earnings: 28000, date: '26 Apr, 18:45', status: 'delivered' },
  { id: 'd5', code: 'ORD-124', sellerName: 'Fresh Market', customerArea: 'Olmazar', distanceKm: 2.9, durationMin: 15, earnings: 12000, date: '26 Apr, 16:20', status: 'delivered' },
  { id: 'd6', code: 'ORD-123', sellerName: 'Plov Usta', customerArea: 'Sergeli', distanceKm: 7.1, durationMin: 38, earnings: 19000, date: '26 Apr, 13:55', status: 'cancelled' },
  { id: 'd7', code: 'ORD-122', sellerName: 'Burger House', customerArea: 'Bektemir', distanceKm: 5.5, durationMin: 29, earnings: 21000, date: '25 Apr, 19:30', status: 'delivered' },
  { id: 'd8', code: 'ORD-121', sellerName: 'Sushi Art', customerArea: 'Uchtepa', distanceKm: 4.2, durationMin: 22, earnings: 17000, date: '25 Apr, 17:00', status: 'delivered' },
];

export default function HistoryPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'delivered' | 'cancelled'>('all');

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { router.replace('/login'); return; }
  }, [router]);

  const list = DEMO.filter(d => filter === 'all' || d.status === filter);
  const totalDeliveries = DEMO.filter(d => d.status === 'delivered').length;
  const totalEarnings = DEMO.filter(d => d.status === 'delivered').reduce((s, d) => s + d.earnings, 0);
  const avgDistance = (DEMO.reduce((s, d) => s + d.distanceKm, 0) / DEMO.length).toFixed(1);

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100dvh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '32px 20px 20px',
        paddingTop: 'max(32px, calc(env(safe-area-inset-top) + 16px))',
      }}>
        <h1 style={{ color: 'var(--text)', fontSize: 22, fontWeight: 800, marginBottom: 18, letterSpacing: '-0.3px' }}>Yetkazishlar tarixi</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Jami', value: totalDeliveries + ' ta' },
            { label: 'Daromad', value: money(totalEarnings / 1000) + 'K' },
            { label: 'O\'rt. masofa', value: avgDistance + ' km' },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: 'var(--surface-2)', borderRadius: 12,
              padding: '12px 10px', textAlign: 'center', border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>{s.value}</div>
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
          {list.map((d) => (
            <div key={d.id} style={{
              background: 'var(--surface)', borderRadius: 16, padding: '14px 16px',
              border: '1px solid var(--border)',
              opacity: d.status === 'cancelled' ? 0.65 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    display: 'grid', placeItems: 'center',
                    color: d.status === 'delivered' ? 'var(--text)' : 'var(--text-muted)',
                  }}>
                    {d.status === 'delivered' ? <IconCheck size={16} stroke={2.2} /> : <IconX size={16} stroke={2.2} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{d.code}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.date}</div>
                  </div>
                </div>
                {d.status === 'delivered' && (
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>
                    +{money(d.earnings)} so'm
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <IconStore size={14} stroke={1.8} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{d.sellerName}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>→ {d.customerArea}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', paddingTop: 6, borderTop: '1px solid var(--border)', marginTop: 4, alignItems: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <IconMapPin size={12} stroke={1.8} /> {d.distanceKm} km
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <IconClock size={12} stroke={1.8} /> {d.durationMin} daq
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CourierBottomNav />
    </div>
  );
}
