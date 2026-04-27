'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SellerSidebar } from '@/components/Sidebar';
import { IconCard, IconWallet, IconCheck, IconClock } from '@/components/Icons';
import { money } from '@/lib/api';

type Payout = {
  id: string; date: string; amount: number; orders: number;
  status: 'paid' | 'pending' | 'processing';
  method: string; ref: string;
};

const PAYOUTS: Payout[] = [
  { id: 'p1', date: '27 Apr, 2026', amount: 3_240_000, orders: 48, status: 'paid', method: "Uzcard *7821", ref: 'PAY-2026-0427' },
  { id: 'p2', date: '20 Apr, 2026', amount: 2_870_000, orders: 41, status: 'paid', method: "Uzcard *7821", ref: 'PAY-2026-0420' },
  { id: 'p3', date: '13 Apr, 2026', amount: 3_510_000, orders: 55, status: 'paid', method: "Uzcard *7821", ref: 'PAY-2026-0413' },
  { id: 'p4', date: '6 Apr, 2026', amount: 2_190_000, orders: 33, status: 'paid', method: "Humo *3311", ref: 'PAY-2026-0406' },
  { id: 'p5', date: '30 Mar, 2026', amount: 4_050_000, orders: 62, status: 'paid', method: "Uzcard *7821", ref: 'PAY-2026-0330' },
];

const PENDING_AMOUNT = 1_470_000;
const PENDING_ORDERS = 23;

const STATUS_LABEL: Record<string, string> = {
  paid: "To'landi",
  pending: "Kutilmoqda",
  processing: "Jarayonda",
};

export default function PayoutsPage() {
  const router = useRouter();
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    const { useAuthStore } = require('@/stores/auth');
    const { token } = useAuthStore.getState();
    if (!token) router.replace('/login');
  }, [router]);

  const handleRequest = async () => {
    setRequesting(true);
    await new Promise(r => setTimeout(r, 1200));
    setRequesting(false);
    setRequested(true);
    setTimeout(() => setRequested(false), 3000);
  };

  return (
    <div className="layout">
      <SellerSidebar />
      <main className="main">
        <div className="page">
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>To'lovlar</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Daromad va to'lovlar tarixi</p>
          </div>

          {/* Pending payout card */}
          <div style={{
            background: 'var(--text)',
            borderRadius: 20, padding: 24, color: 'var(--surface)', marginBottom: 24,
          }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600, marginBottom: 6, letterSpacing: '0.5px' }}>
              KEYINGI TO'LOV
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-1px', marginBottom: 4 }}>
              {money(PENDING_AMOUNT)} so'm
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 20 }}>
              {PENDING_ORDERS} ta buyurtmadan · Dushanba, 4 May
            </div>
            <button
              onClick={handleRequest}
              disabled={requesting || requested}
              style={{
                background: requested ? 'rgba(255,255,255,0.18)' : 'var(--surface)',
                color: requested ? 'var(--surface)' : 'var(--text)',
                border: 'none', borderRadius: 10, padding: '11px 20px',
                fontWeight: 700, fontSize: 13, cursor: requesting || requested ? 'default' : 'pointer',
                transition: 'all 200ms',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              {requesting ? 'Yuborilmoqda…' : requested ? <><IconCheck size={16} stroke={2.2} /> Soʻrov yuborildi</> : 'Erta olish soʻrovi'}
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Bu oy jami', value: money(3_240_000) + " so'm" },
              { label: 'O\'tgan oy', value: money(2_870_000) + " so'm" },
              { label: 'Komissiya', value: '8%' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--surface)', borderRadius: 14, padding: '14px 16px',
                border: '1px solid var(--border)', textAlign: 'center',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Bank card info */}
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: '16px',
            border: '1px solid var(--border)', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              display: 'grid', placeItems: 'center', flexShrink: 0,
              color: 'var(--text)',
            }}>
              <IconCard size={20} stroke={1.7} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Uzcard *7821</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Asosiy to'lov kartasi</div>
            </div>
            <button style={{
              background: 'none', border: '1.5px solid var(--border)',
              borderRadius: 10, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text)',
            }}>
              O'zgartirish
            </button>
          </div>

          {/* Payout history */}
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>To'lovlar tarixi</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PAYOUTS.map(p => (
              <div key={p.id} style={{
                background: 'var(--surface)', borderRadius: 14, padding: '16px',
                border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                  color: 'var(--text)',
                }}>
                  <IconWallet size={18} stroke={1.7} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.ref}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.date} · {p.orders} ta buyurtma</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{p.method}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>
                    +{money(p.amount)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>so'm</div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6,
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                  }}>
                    {p.status === 'paid' ? <IconCheck size={10} stroke={2.4} /> : <IconClock size={10} stroke={1.8} />}
                    {STATUS_LABEL[p.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
