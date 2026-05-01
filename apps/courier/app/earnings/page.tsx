'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CourierBottomNav } from '@/components/BottomNav';
import { IconCheck, IconClock } from '@/components/Icons';
import { api, money } from '@/lib/api';

interface LedgerEntry {
  id: string;
  type: 'COURIER_FEE' | 'REFUND';
  amount: number;
  status: 'PENDING' | 'AVAILABLE' | 'PAID_OUT' | 'REVERSED';
  createdAt: string;
  availableAt: string | null;
  paidOutAt: string | null;
  order: { id: string; createdAt: string; deliveredAt: string | null; status: string } | null;
}

interface Summary {
  available: number;
  pending: number;
  paidOut: number;
  lifetimeEarned: number;
  thisMonth: number;
  bankCardNumber: string | null;
  bankCardHolder: string | null;
  recentEntries: LedgerEntry[];
}

interface Payout {
  id: string;
  amount: string | number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  bankCardSnapshot: string | null;
  rejectionReason: string | null;
  requestedAt: string;
}

const PAYOUT_LABEL: Record<Payout['status'], string> = {
  PENDING: 'Kutilmoqda',
  APPROVED: 'Tasdiqlangan',
  PAID: "To'landi",
  REJECTED: 'Rad etildi',
};

export default function EarningsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [history, setHistory] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [showCardEditor, setShowCardEditor] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      router.replace('/login');
      return;
    }
  }, [router]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, h] = await Promise.all([
        api<Summary>('/payouts/courier/summary'),
        api<Payout[]>('/payouts/courier/history'),
      ]);
      setSummary(s);
      setHistory(h);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const requestPayout = async () => {
    if (!summary) return;
    if (!summary.bankCardNumber) {
      setShowCardEditor(true);
      return;
    }
    if (summary.available <= 0) {
      setError("Yechib olish uchun mablag` mavjud emas");
      return;
    }
    setRequesting(true);
    setError('');
    try {
      await api('/payouts/courier/request', { method: 'POST', body: {} });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setRequesting(false);
    }
  };

  // Group recent entries by day for the bar chart
  const dayBars = useMemo(() => {
    if (!summary) return [];
    const byDay = new Map<string, { amount: number; deliveries: number; date: Date }>();
    for (const e of summary.recentEntries) {
      if (e.type !== 'COURIER_FEE') continue;
      const d = new Date(e.createdAt);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString();
      const cur = byDay.get(key) ?? { amount: 0, deliveries: 0, date: d };
      cur.amount += e.amount;
      cur.deliveries += 1;
      byDay.set(key, cur);
    }
    const sorted = Array.from(byDay.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    return sorted.slice(-7);
  }, [summary]);

  const maxBar = Math.max(1, ...dayBars.map(d => d.amount));
  const today = new Date().toDateString();
  const todayEarnings = summary?.recentEntries
    .filter(e => e.type === 'COURIER_FEE' && new Date(e.createdAt).toDateString() === today)
    .reduce((s, e) => s + e.amount, 0) ?? 0;

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100dvh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '32px 20px 20px',
        paddingTop: 'max(32px, calc(env(safe-area-inset-top) + 16px))',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <h1 style={{ color: 'var(--text)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>
            Daromadim
          </h1>
          <button
            onClick={reload}
            style={{
              padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--surface-2)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}
          >
            {loading ? '…' : '↻'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Bugun', value: money(todayEarnings) + " so'm" },
            { label: 'Bu oy', value: money(summary?.thisMonth ?? 0) + " so'm" },
            { label: 'Kutilmoqda', value: money(summary?.pending ?? 0) + " so'm" },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: 'var(--surface-2)',
              borderRadius: 12, padding: '12px 10px', border: '1px solid var(--border)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, letterSpacing: '0.5px' }}>
                {s.label.toUpperCase()}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 16px' }}>
        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {/* Available balance + withdraw */}
        <div style={{
          background: 'var(--text)', borderRadius: 16, padding: 20,
          color: 'var(--surface)', marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600, marginBottom: 4, letterSpacing: '0.5px' }}>
            YECHIB OLISH UCHUN MAVJUD
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 14 }}>
            {money(summary?.available ?? 0)} so&apos;m
          </div>
          <button
            onClick={requestPayout}
            disabled={requesting || (summary?.available ?? 0) <= 0}
            style={{
              background: 'var(--surface)', color: 'var(--text)',
              border: 'none', borderRadius: 10, padding: '10px 18px',
              fontWeight: 700, fontSize: 13,
              cursor: requesting ? 'default' : 'pointer',
              opacity: (summary?.available ?? 0) <= 0 ? 0.5 : 1,
              width: '100%',
            }}
          >
            {requesting ? 'Yuborilmoqda…' : "Yechib olish"}
          </button>
        </div>

        {/* Bar chart */}
        {dayBars.length > 0 && (
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: 16,
            border: '1px solid var(--border)', marginBottom: 20,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Kunlik daromad</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Oxirgi {dayBars.length} kun · so&apos;m
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
              {dayBars.map(d => (
                <div key={d.date.toISOString()} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: '100%',
                    height: `${Math.max(8, (d.amount / maxBar) * 88)}px`,
                    background: 'var(--text)',
                    borderRadius: '4px 4px 0 0',
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
                      fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap',
                    }}>
                      {d.deliveries}ta
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    {d.date.toLocaleDateString('uz-UZ', { weekday: 'short' }).slice(0, 2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bank card */}
        <div style={{
          background: 'var(--surface)', borderRadius: 14, padding: 14,
          border: '1px solid var(--border)', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)',
            border: '1px solid var(--border)', display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>💳</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              {summary?.bankCardNumber
                ? maskCard(summary.bankCardNumber)
                : "Karta qo'shilmagan"}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {summary?.bankCardHolder ?? "Yechib olishlar uchun karta"}
            </div>
          </div>
          <button
            onClick={() => setShowCardEditor(true)}
            style={{
              background: 'transparent', border: '1.5px solid var(--border)',
              borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', color: 'var(--text)',
            }}
          >
            {summary?.bankCardNumber ? "O'zgartirish" : "Qo'shish"}
          </button>
        </div>

        {showCardEditor && (
          <CardEditor
            initialNumber={summary?.bankCardNumber ?? ''}
            initialHolder={summary?.bankCardHolder ?? ''}
            onClose={() => setShowCardEditor(false)}
            onSaved={async () => {
              setShowCardEditor(false);
              await reload();
            }}
          />
        )}

        {/* Recent earnings */}
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>
          So&apos;nggi yetkazib berishlar
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {(summary?.recentEntries.filter(e => e.type === 'COURIER_FEE') ?? []).map(e => (
            <div key={e.id} style={{
              background: 'var(--surface)', borderRadius: 14, padding: '14px 16px',
              border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                display: 'grid', placeItems: 'center',
                color: e.status === 'AVAILABLE' || e.status === 'PAID_OUT' ? 'var(--text)' : 'var(--text-muted)',
              }}>
                {e.status === 'PAID_OUT' || e.status === 'AVAILABLE'
                  ? <IconCheck size={18} stroke={2.2} />
                  : <IconClock size={18} stroke={1.8} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  #{e.order?.id.slice(0, 8).toUpperCase() ?? '—'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {new Date(e.createdAt).toLocaleString()}
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 700, marginTop: 2,
                  color: e.status === 'AVAILABLE' ? '#065f46'
                    : e.status === 'PAID_OUT' ? 'var(--text-muted)'
                    : '#92400e',
                }}>
                  {e.status === 'AVAILABLE' ? 'Yechib olishga tayyor'
                    : e.status === 'PAID_OUT' ? "To'langan"
                    : "Yetkazib berish kutilmoqda"}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>+{money(e.amount)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>so&apos;m</div>
              </div>
            </div>
          ))}
          {(!summary || summary.recentEntries.length === 0) && (
            <div style={{
              background: 'var(--surface)', borderRadius: 14, padding: '20px 16px',
              border: '1px solid var(--border)', textAlign: 'center',
              color: 'var(--text-muted)', fontSize: 13,
            }}>
              Hali yetkazib berish yo&apos;q
            </div>
          )}
        </div>

        {/* Payout history */}
        {history.length > 0 && (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>
              Yechib olish so&apos;rovlari
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map(p => (
                <div key={p.id} style={{
                  background: 'var(--surface)', borderRadius: 12, padding: 14,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>
                        {money(Number(p.amount))} so&apos;m
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(p.requestedAt).toLocaleString()}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6,
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      color: p.status === 'PAID' ? '#065f46' : p.status === 'REJECTED' ? '#991b1b' : '#92400e',
                    }}>
                      {PAYOUT_LABEL[p.status]}
                    </span>
                  </div>
                  {p.rejectionReason && (
                    <div style={{ fontSize: 11, color: '#991b1b', marginTop: 6 }}>
                      Sabab: {p.rejectionReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <CourierBottomNav />
    </div>
  );
}

function maskCard(card: string): string {
  if (!card || card.length < 4) return card;
  return `**** **** **** ${card.slice(-4)}`;
}

function CardEditor({
  initialNumber, initialHolder, onClose, onSaved,
}: {
  initialNumber: string; initialHolder: string;
  onClose: () => void; onSaved: () => void | Promise<void>;
}) {
  const [num, setNum] = useState(initialNumber);
  const [holder, setHolder] = useState(initialHolder);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setSaving(true);
    setErr('');
    try {
      await api('/payouts/courier/bank', {
        method: 'PUT',
        body: { bankCardNumber: num.replace(/\s+/g, ''), bankCardHolder: holder },
      });
      await onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Saqlab bo`lmadi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'grid', placeItems: 'center', zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 16, padding: 20,
        maxWidth: 380, width: '100%',
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
          Bank karta ma&apos;lumotlari
        </h3>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
            Karta raqami
          </div>
          <input
            value={num}
            onChange={e => setNum(e.target.value)}
            placeholder="8600 1234 5678 9012"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--surface-2)',
              fontSize: 14, fontFamily: 'monospace',
            }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
            Karta egasi
          </div>
          <input
            value={holder}
            onChange={e => setHolder(e.target.value)}
            placeholder="ALIYEV ALI"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--surface-2)',
              fontSize: 14,
            }}
          />
        </label>

        {err && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, fontSize: 12, marginBottom: 10 }}>
            {err}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: 10, borderRadius: 10, border: '1px solid var(--border)',
              background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: 13,
            }}
          >
            Bekor
          </button>
          <button
            onClick={save}
            disabled={saving}
            style={{
              flex: 1, padding: 10, borderRadius: 10, border: 'none',
              background: 'var(--text)', color: 'var(--surface)',
              fontWeight: 700, fontSize: 13, cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? '…' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}
