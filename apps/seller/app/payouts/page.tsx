'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SellerSidebar } from '@/components/Sidebar';
import { IconCard, IconWallet, IconCheck, IconClock } from '@/components/Icons';
import { api, money } from '@/lib/api';

interface Summary {
  available: number;
  pending: number;
  paidOut: number;
  lifetimeEarned: number;
  thisMonth: number;
  bankCardNumber: string | null;
  bankCardHolder: string | null;
  commissionRate: number;
  recentEntries: LedgerEntry[];
}

interface LedgerEntry {
  id: string;
  type: 'SELLER_PAYOUT' | 'COMMISSION' | 'COURIER_FEE' | 'DELIVERY_MARGIN' | 'SERVICE_FEE' | 'REFUND';
  amount: number;
  status: 'PENDING' | 'AVAILABLE' | 'PAID_OUT' | 'REVERSED';
  createdAt: string;
  availableAt: string | null;
  paidOutAt: string | null;
  order: { id: string; totalAmount: string | number; createdAt: string; status: string } | null;
}

interface Payout {
  id: string;
  amount: string | number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  bankCardSnapshot: string | null;
  bankCardHolderSnapshot: string | null;
  rejectionReason: string | null;
  requestedAt: string;
  processedAt: string | null;
}

const PAYOUT_LABEL: Record<Payout['status'], string> = {
  PENDING: 'Kutilmoqda',
  APPROVED: 'Tasdiqlangan',
  PAID: "To'landi",
  REJECTED: 'Rad etildi',
};

const PAYOUT_COLOR: Record<Payout['status'], string> = {
  PENDING: '#92400e',
  APPROVED: '#1e40af',
  PAID: '#065f46',
  REJECTED: '#991b1b',
};

export default function PayoutsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [history, setHistory] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [showCardEditor, setShowCardEditor] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      if (typeof window === 'undefined') return;
      if (!localStorage.getItem('access_token')) {
        router.replace('/login');
        return;
      }
      setAuthChecked(true);
    }, 0);
    return () => clearTimeout(id);
  }, [router]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, h] = await Promise.all([
        api<Summary>('/payouts/seller/summary'),
        api<Payout[]>('/payouts/seller/history'),
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
    if (!authChecked) return;
    reload();
  }, [authChecked, reload]);

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
      await api('/payouts/seller/request', { method: 'POST', body: {} });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setRequesting(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="layout">
        <SellerSidebar />
        <main className="main">
          <div className="page" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            Yuklanmoqda…
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="layout">
      <SellerSidebar />
      <main className="main">
        <div className="page">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>To&apos;lovlar</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Daromad va to&apos;lovlar tarixi
              </p>
            </div>
            <button
              onClick={reload}
              style={{
                padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--surface)', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              }}
            >
              {loading ? 'Yangilanmoqda…' : 'Yangilash'}
            </button>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          {/* Available balance card */}
          <div style={{
            background: 'var(--text)', borderRadius: 20, padding: 24,
            color: 'var(--surface)', marginBottom: 24,
          }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600, marginBottom: 6, letterSpacing: '0.5px' }}>
              YECHIB OLISH UCHUN MAVJUD
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-1px', marginBottom: 4 }}>
              {money(summary?.available ?? 0)} so&apos;m
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 20 }}>
              Komissiya {((summary?.commissionRate ?? 0) * 100).toFixed(1)}% chegirilgan
              {summary && summary.pending > 0 && ` · ${money(summary.pending)} so'm yetkazib berishni kutmoqda`}
            </div>
            <button
              onClick={requestPayout}
              disabled={requesting || (summary?.available ?? 0) <= 0}
              style={{
                background: 'var(--surface)', color: 'var(--text)',
                border: 'none', borderRadius: 10, padding: '11px 20px',
                fontWeight: 700, fontSize: 13,
                cursor: requesting ? 'default' : 'pointer',
                opacity: (summary?.available ?? 0) <= 0 ? 0.5 : 1,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              {requesting ? 'Yuborilmoqda…' : "Yechib olish so'rovi"}
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Bu oy', value: money(summary?.thisMonth ?? 0) + " so'm" },
              { label: 'Jami daromad', value: money(summary?.lifetimeEarned ?? 0) + " so'm" },
              { label: 'Komissiya', value: ((summary?.commissionRate ?? 0) * 100).toFixed(1) + '%' },
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

          {/* Bank card */}
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: '16px',
            border: '1px solid var(--border)', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: 'var(--surface-2)',
              border: '1px solid var(--border)', display: 'grid', placeItems: 'center',
              flexShrink: 0, color: 'var(--text)',
            }}>
              <IconCard size={20} stroke={1.7} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {summary?.bankCardNumber
                  ? maskCard(summary.bankCardNumber)
                  : "Karta qo'shilmagan"}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {summary?.bankCardHolder ?? "To'lovlar uchun karta ma'lumotlari kerak"}
              </div>
            </div>
            <button
              onClick={() => setShowCardEditor(true)}
              style={{
                background: 'none', border: '1.5px solid var(--border)',
                borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', color: 'var(--text)',
              }}
            >
              {summary?.bankCardNumber ? "O'zgartirish" : "Qo'shish"}
            </button>
          </div>

          {/* Card editor */}
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

          {/* Payout history */}
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>
            To&apos;lov so&apos;rovlari tarixi
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {history.length === 0 && (
              <div style={{
                background: 'var(--surface)', borderRadius: 14, padding: '20px 16px',
                border: '1px solid var(--border)', textAlign: 'center',
                color: 'var(--text-muted)', fontSize: 13,
              }}>
                Hozircha to&apos;lov so&apos;rovlari yo&apos;q
              </div>
            )}
            {history.map(p => (
              <div key={p.id} style={{
                background: 'var(--surface)', borderRadius: 14, padding: '16px',
                border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, background: 'var(--surface-2)',
                  border: '1px solid var(--border)', display: 'grid', placeItems: 'center',
                  flexShrink: 0, color: 'var(--text)',
                }}>
                  <IconWallet size={18} stroke={1.7} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {p.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(p.requestedAt).toLocaleString()}
                  </div>
                  {p.bankCardSnapshot && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {p.bankCardSnapshot}
                    </div>
                  )}
                  {p.rejectionReason && (
                    <div style={{ fontSize: 11, color: '#991b1b', marginTop: 2 }}>
                      Sabab: {p.rejectionReason}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>
                    {money(Number(p.amount))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>so&apos;m</div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6,
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    color: PAYOUT_COLOR[p.status],
                  }}>
                    {p.status === 'PAID' ? <IconCheck size={10} stroke={2.4} /> : <IconClock size={10} stroke={1.8} />}
                    {PAYOUT_LABEL[p.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent ledger entries */}
          {summary && summary.recentEntries.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>
                Yaqinda buyurtmalardan tushum
              </div>
              <div style={{
                background: 'var(--surface)', borderRadius: 14,
                border: '1px solid var(--border)', overflow: 'hidden',
              }}>
                {summary.recentEntries.map((e, i) => (
                  <div key={e.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        Buyurtma #{e.order?.id.slice(0, 8).toUpperCase() ?? '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(e.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>+{money(e.amount)}</div>
                      <div style={{
                        fontSize: 10, fontWeight: 700,
                        color: e.status === 'AVAILABLE' ? '#065f46'
                          : e.status === 'PAID_OUT' ? 'var(--text-muted)'
                          : '#92400e',
                      }}>
                        {e.status === 'AVAILABLE' ? 'Yechib olishga tayyor'
                          : e.status === 'PAID_OUT' ? "To'langan"
                          : e.status === 'PENDING' ? "To'lov kutilmoqda"
                          : 'Bekor qilingan'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function maskCard(card: string): string {
  if (!card || card.length < 4) return card;
  return `**** **** **** ${card.slice(-4)}`;
}

function CardEditor({
  initialNumber,
  initialHolder,
  onClose,
  onSaved,
}: {
  initialNumber: string;
  initialHolder: string;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [num, setNum] = useState(initialNumber);
  const [holder, setHolder] = useState(initialHolder);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setSaving(true);
    setErr('');
    try {
      await api('/payouts/seller/bank', {
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
      display: 'grid', placeItems: 'center', zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 16, padding: 24,
        maxWidth: 420, width: '100%', boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          Bank karta ma&apos;lumotlari
        </h3>

        <label style={{ display: 'block', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
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

        <label style={{ display: 'block', marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
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
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
            {err}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '10px 18px', borderRadius: 10, border: '1px solid var(--border)',
              background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: 13,
            }}
          >
            Bekor qilish
          </button>
          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: '10px 18px', borderRadius: 10, border: 'none',
              background: 'var(--text)', color: 'var(--surface)',
              cursor: saving ? 'default' : 'pointer', fontWeight: 700, fontSize: 13,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}
