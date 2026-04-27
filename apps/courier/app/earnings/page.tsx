'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CourierBottomNav } from '@/components/BottomNav';
import { api, money } from '@/lib/api';

type DayEarning = { day: string; amount: number; deliveries: number };
type Transaction = { id: string; date: string; amount: number; orderId: string; status: 'paid' | 'pending' };

const DEMO_DAYS: DayEarning[] = [
  { day: 'Du', amount: 45000, deliveries: 4 },
  { day: 'Se', amount: 78000, deliveries: 6 },
  { day: 'Ch', amount: 32000, deliveries: 3 },
  { day: 'Pa', amount: 91000, deliveries: 7 },
  { day: 'Ju', amount: 120000, deliveries: 9 },
  { day: 'Sh', amount: 145000, deliveries: 11 },
  { day: 'Ya', amount: 84000, deliveries: 7 },
];

const DEMO_TX: Transaction[] = [
  { id: 't1', date: '2026-04-27 14:32', amount: 18000, orderId: 'ORD-128', status: 'paid' },
  { id: 't2', date: '2026-04-27 12:11', amount: 22000, orderId: 'ORD-127', status: 'paid' },
  { id: 't3', date: '2026-04-27 10:05', amount: 15000, orderId: 'ORD-126', status: 'paid' },
  { id: 't4', date: '2026-04-26 18:45', amount: 28000, orderId: 'ORD-125', status: 'paid' },
  { id: 't5', date: '2026-04-26 16:20', amount: 12000, orderId: 'ORD-124', status: 'paid' },
  { id: 't6', date: '2026-04-26 13:55', amount: 19000, orderId: 'ORD-123', status: 'paid' },
  { id: 't7', date: '2026-04-27 15:00', amount: 35000, orderId: 'ORD-129', status: 'pending' },
];

export default function EarningsPage() {
  const router = useRouter();
  const [days] = useState<DayEarning[]>(DEMO_DAYS);
  const [txs] = useState<Transaction[]>(DEMO_TX);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { router.replace('/login'); return; }
  }, [router]);

  const todayEarnings = txs.filter(t => t.date.startsWith('2026-04-27') && t.status === 'paid').reduce((s, t) => s + t.amount, 0);
  const weekTotal = days.reduce((s, d) => s + d.amount, 0);
  const pending = txs.filter(t => t.status === 'pending').reduce((s, t) => s + t.amount, 0);
  const maxBar = Math.max(...days.map(d => d.amount));

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100dvh', paddingBottom: 80 }}>
      {/* Header gradient */}
      <div style={{
        background: 'linear-gradient(160deg, #064e3b 0%, #10b981 100%)',
        padding: '48px 20px 28px',
        paddingTop: 'max(48px, calc(env(safe-area-inset-top) + 20px))',
      }}>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Daromadim</h1>

        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'Bugun', value: money(todayEarnings) + " so'm" },
            { label: 'Bu hafta', value: money(weekTotal) + " so'm" },
            { label: 'Kutilmoqda', value: money(pending) + " so'm" },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: 'rgba(255,255,255,0.15)',
              borderRadius: 14, padding: '12px 10px', backdropFilter: 'blur(8px)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 4 }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 16px' }}>
        {/* Period tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'var(--surface-2)', borderRadius: 12, padding: 4 }}>
          {(['week', 'month'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              flex: 1, padding: '8px 0', borderRadius: 9, border: 'none',
              background: period === p ? '#fff' : 'transparent',
              color: period === p ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: period === p ? 700 : 500, fontSize: 14,
              cursor: 'pointer', boxShadow: period === p ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
              transition: 'all 200ms',
            }}>
              {p === 'week' ? 'Hafta' : 'Oy'}
            </button>
          ))}
        </div>

        {/* Bar chart */}
        <div style={{
          background: 'var(--surface)', borderRadius: 16, padding: '16px',
          border: '1px solid var(--border)', marginBottom: 20,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Kunlik daromad</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Oxirgi 7 kun · so'm</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
            {days.map((d) => (
              <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: '100%',
                  height: `${Math.max(8, (d.amount / maxBar) * 88)}px`,
                  background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 400ms ease',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap',
                  }}>
                    {d.deliveries}ta
                  </div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>
          So'nggi to'lovlar
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {txs.map((tx) => (
            <div key={tx.id} style={{
              background: 'var(--surface)', borderRadius: 14, padding: '14px 16px',
              border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: tx.status === 'paid' ? 'var(--success-light)' : 'var(--warning-light)',
                display: 'grid', placeItems: 'center', fontSize: 18,
              }}>
                {tx.status === 'paid' ? '✅' : '⏳'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{tx.orderId}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tx.date}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: tx.status === 'paid' ? 'var(--success)' : 'var(--warning)' }}>
                  +{money(tx.amount)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>so'm</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CourierBottomNav />
    </div>
  );
}
