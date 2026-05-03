'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { BottomNav } from '@/components/BottomNav';

interface Card {
  id: string;
  last4: string;
  holderName: string;
  provider: 'UZCARD' | 'HUMO' | 'VISA' | 'MASTERCARD' | 'UNKNOWN';
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  createdAt: string;
}

const PROVIDER_LABEL: Record<Card['provider'], string> = {
  UZCARD: 'Uzcard',
  HUMO: 'Humo',
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  UNKNOWN: 'Karta',
};

const PROVIDER_GRADIENT: Record<Card['provider'], string> = {
  UZCARD: 'linear-gradient(135deg, #16a34a 0%, #166534 100%)',
  HUMO: 'linear-gradient(135deg, #0ea5e9 0%, #075985 100%)',
  VISA: 'linear-gradient(135deg, #1e40af 0%, #1e1b4b 100%)',
  MASTERCARD: 'linear-gradient(135deg, #ea580c 0%, #7f1d1d 100%)',
  UNKNOWN: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)',
};

export default function CardsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('access_token')) {
      router.replace('/login?redirect=/profile/cards');
    }
  }, [router]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await api<Card[]>('/customer/cards');
      setCards(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yuklanmadi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const setDefault = async (id: string) => {
    try {
      await api(`/customer/cards/${id}/default`, { method: 'PATCH' });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik');
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Kartani o'chirishni xohlaysizmi?")) return;
    try {
      await api(`/customer/cards/${id}`, { method: 'DELETE' });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik');
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: 'max(20px, calc(env(safe-area-inset-top) + 12px)) 16px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 22, color: 'var(--text)', padding: 4,
          }}
          aria-label="Orqaga"
        >‹</button>
        <h1 style={{ fontSize: 18, fontWeight: 800, flex: 1 }}>Mening kartalarim</h1>
      </div>

      <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto' }}>
        {error && (
          <div style={{
            background: 'var(--danger-light)', color: 'var(--danger)', padding: 12,
            borderRadius: 10, fontSize: 13, marginBottom: 12,
          }}>{error}</div>
        )}

        {/* Cards list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {cards.map(c => (
            <div key={c.id} style={{
              background: PROVIDER_GRADIENT[c.provider],
              color: '#fff', borderRadius: 16, padding: '20px 18px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              position: 'relative', minHeight: 160,
            }}>
              {/* top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.5px', opacity: 0.9 }}>
                  {PROVIDER_LABEL[c.provider]}
                </div>
                {c.isDefault && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px',
                    background: 'rgba(255,255,255,0.2)', borderRadius: 6,
                    letterSpacing: '0.5px',
                  }}>
                    ASOSIY
                  </span>
                )}
              </div>

              {/* card number */}
              <div style={{
                fontSize: 18, fontWeight: 700, letterSpacing: '2px',
                fontFamily: 'monospace', marginBottom: 14,
              }}>
                **** **** **** {c.last4}
              </div>

              {/* bottom row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: 9, opacity: 0.7, letterSpacing: '0.5px', marginBottom: 2 }}>
                    KARTA EGASI
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{c.holderName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, opacity: 0.7, letterSpacing: '0.5px', marginBottom: 2 }}>
                    AMAL QILADI
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                    {String(c.expiryMonth).padStart(2, '0')}/{String(c.expiryYear).slice(-2)}
                  </div>
                </div>
              </div>

              {/* actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                {!c.isDefault && (
                  <button
                    onClick={() => setDefault(c.id)}
                    style={{
                      flex: 1, background: 'rgba(255,255,255,0.18)', border: 'none',
                      color: '#fff', padding: '8px 12px', borderRadius: 8,
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    Asosiy qilish
                  </button>
                )}
                <button
                  onClick={() => remove(c.id)}
                  style={{
                    background: 'rgba(0,0,0,0.25)', border: 'none', color: '#fff',
                    padding: '8px 14px', borderRadius: 8,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  O&apos;chirish
                </button>
              </div>
            </div>
          ))}

          {!loading && cards.length === 0 && (
            <div style={{
              background: 'var(--surface)', borderRadius: 14, padding: '32px 20px',
              border: '1px dashed var(--border)', textAlign: 'center',
              color: 'var(--text-muted)',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💳</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                Hali karta qo&apos;shilmagan
              </div>
              <div style={{ fontSize: 12 }}>
                Tezkor to&apos;lov uchun kartangizni qo&apos;shing
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowAdd(true)}
          style={{
            width: '100%', padding: '14px',
            background: 'var(--text)', color: 'var(--surface)',
            border: 'none', borderRadius: 14,
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>+</span>
          Yangi karta qo&apos;shish
        </button>

        <div style={{
          marginTop: 16, padding: 12, fontSize: 11,
          color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5,
        }}>
          Karta to&apos;liq raqami biz tomonimizdan saqlanmaydi.<br/>
          Faqat oxirgi 4 raqam va token ko&apos;rinishida saqlanadi.
        </div>
      </div>

      {showAdd && (
        <AddCardModal
          onClose={() => setShowAdd(false)}
          onSaved={async () => {
            setShowAdd(false);
            await reload();
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}

function AddCardModal({ onClose, onSaved }: {
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [exp, setExp] = useState(''); // MM/YY
  const [setDefault, setSetDefault] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const formatNumber = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 19);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExp = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + '/' + digits.slice(2);
  };

  const submit = async () => {
    setErr('');
    const cleaned = number.replace(/\s+/g, '');
    if (cleaned.length < 13) {
      setErr('Karta raqami to`liq emas');
      return;
    }
    const [mmStr, yyStr] = exp.split('/');
    const mm = Number(mmStr);
    const yy = Number(yyStr);
    if (!mm || !yy || mm < 1 || mm > 12) {
      setErr('Amal qilish muddati noto`g`ri');
      return;
    }
    const fullYear = 2000 + yy;
    if (!holder.trim()) {
      setErr('Karta egasi ismini kiriting');
      return;
    }

    setSaving(true);
    try {
      await api('/customer/cards', {
        method: 'POST',
        body: {
          cardNumber: cleaned,
          holderName: holder,
          expiryMonth: mm,
          expiryYear: fullYear,
          setDefault,
        },
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
      display: 'grid', placeItems: 'flex-end', zIndex: 1000,
    }}>
      <div style={{
        background: 'var(--surface)', width: '100%',
        borderRadius: '20px 20px 0 0', padding: '20px 18px',
        paddingBottom: 'max(20px, env(safe-area-inset-bottom) + 12px)',
        maxWidth: 480, margin: '0 auto',
      }}>
        <div style={{
          width: 40, height: 4, background: 'var(--border)',
          borderRadius: 2, margin: '0 auto 16px',
        }} />

        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>
          Yangi karta qo&apos;shish
        </h3>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.5px' }}>
            KARTA RAQAMI
          </div>
          <input
            value={number}
            onChange={(e) => setNumber(formatNumber(e.target.value))}
            placeholder="8600 1234 5678 9012"
            inputMode="numeric"
            autoComplete="cc-number"
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--surface-alt)',
              fontSize: 16, fontFamily: 'monospace', letterSpacing: '1px',
            }}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <label>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.5px' }}>
              MUDDATI
            </div>
            <input
              value={exp}
              onChange={(e) => setExp(formatExp(e.target.value))}
              placeholder="MM/YY"
              inputMode="numeric"
              autoComplete="cc-exp"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'var(--surface-alt)',
                fontSize: 16, fontFamily: 'monospace',
              }}
            />
          </label>
          <label>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.5px' }}>
              EGASI
            </div>
            <input
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              placeholder="ALI VALIYEV"
              autoComplete="cc-name"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'var(--surface-alt)',
                fontSize: 14, textTransform: 'uppercase',
              }}
            />
          </label>
        </div>

        <label style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
          fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={setDefault}
            onChange={(e) => setSetDefault(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
          Asosiy karta qilish
        </label>

        {err && (
          <div style={{
            background: 'var(--danger-light)', color: 'var(--danger)', padding: 10,
            borderRadius: 8, fontSize: 12, marginBottom: 10,
          }}>{err}</div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1, padding: 14, borderRadius: 12,
              border: '1px solid var(--border)', background: 'transparent',
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}
          >
            Bekor
          </button>
          <button
            onClick={submit}
            disabled={saving}
            style={{
              flex: 2, padding: 14, borderRadius: 12, border: 'none',
              background: 'var(--text)', color: 'var(--surface)',
              fontWeight: 700, fontSize: 14,
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saqlanmoqda…' : 'Qo`shish'}
          </button>
        </div>
      </div>
    </div>
  );
}
