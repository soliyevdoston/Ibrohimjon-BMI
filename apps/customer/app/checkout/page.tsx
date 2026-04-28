'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LocationPicker } from '@/components/map/LocationPicker';
import { useCartStore } from '@/stores/cart';
import { api, money, reverseGeocode } from '@/lib/api';

type Step = 1 | 2 | 3;
type PaymentMethod = 'cash' | 'card' | 'payme' | 'click';

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; desc: string }[] = [
  { id: 'cash',  label: 'Naqd pul',  desc: "Yetkazib berishda to'lang" },
  { id: 'card',  label: 'Karta',     desc: 'Bank kartasi orqali' },
  { id: 'payme', label: 'Payme',     desc: 'Payme ilovasi orqali' },
  { id: 'click', label: 'Click',     desc: 'Click ilovasi orqali' },
];

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="stepper">
      {([1, 2, 3] as Step[]).map((s, idx) => {
        const state = s < step ? 'done' : s === step ? 'active' : 'pending';
        return (
          <div key={s} className="stepper-step">
            <div className={`stepper-circle ${state}`}>
              {state === 'done' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : s}
            </div>
            {idx < 2 && <div className={`stepper-line${state === 'done' ? ' done' : ''}`} />}
          </div>
        );
      })}
    </div>
  );
}

const STEP_TITLES: Record<Step, string> = { 1: 'Manzil', 2: "To'lov", 3: 'Tasdiqlash' };

function calcDeliveryFee(lat: number, lng: number): number {
  const centerLat = 41.2995, centerLng = 69.2401;
  const kmLat = Math.abs(lat - centerLat) * 111;
  const kmLng = Math.abs(lng - centerLng) * 85;
  const km = Math.sqrt(kmLat * kmLat + kmLng * kmLng);
  return Math.round(6000 + km * 1200);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clear } = useCartStore();

  const [step, setStep] = useState<Step>(1);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) router.replace('/login?redirect=/checkout');
    if (items.length === 0 && step === 1) router.replace('/home');
  }, [items.length, router, step]);

  const handleMapSelect = useCallback(async (lat: number, lng: number) => {
    setSelected([lat, lng]);
    setLoadingAddress(true);
    try {
      const addr = await reverseGeocode(lat, lng);
      setAddress(addr);
    } finally {
      setLoadingAddress(false);
    }
  }, []);

  const deliveryFee = selected ? calcDeliveryFee(selected[0], selected[1]) : 8000;
  const sub = subtotal();
  const total = sub + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!selected) return;
    const token = localStorage.getItem('access_token');
    if (!token) { router.replace('/login?redirect=/checkout'); return; }

    setLoading(true);
    setError('');
    try {
      const order = await api<{ id: string }>('/orders', {
        method: 'POST', token,
        body: {
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, sellerId: i.sellerId })),
          deliveryAddress: address,
          deliveryLat: selected[0],
          deliveryLng: selected[1],
          paymentMethod,
        },
      });

      try {
        await api('/payments', {
          method: 'POST', token,
          body: { orderId: order.id, method: paymentMethod, amount: total },
        });
      } catch { /* payment endpoint optional */ }

      setOrderId(order.id);
      clear();
      setStep(3);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Buyurtma berishda xato');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 16px 0',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <button
            onClick={() => step > 1 && step < 3 ? setStep((s) => (s - 1) as Step) : router.back()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text)', fontSize: 22, lineHeight: 1 }}
            aria-label="Orqaga"
          >
            ←
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 700, flex: 1, textAlign: 'center', marginRight: 32 }}>
            {STEP_TITLES[step]}
          </h1>
        </div>
        <StepIndicator step={step} />
      </div>

      <div style={{ padding: '16px', maxWidth: 680, margin: '0 auto' }}>

        {/* ===== STEP 1: LOCATION ===== */}
        {step === 1 && (
          <div className="stack fade-in">
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 16px 12px' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                  Yetkazish manzilini belgilang
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Xaritaga bosib manzilni tanlang
                </p>
              </div>

              <LocationPicker selected={selected} onSelect={handleMapSelect} />

              <div style={{ padding: '14px 16px 16px' }}>
                {loadingAddress ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 14 }}>
                    <div style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--text)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Manzil aniqlanmoqda…
                  </div>
                ) : address ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ color: 'var(--text)', flexShrink: 0, marginTop: 1 }}><PinIcon /></span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>Tanlangan manzil</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.5 }}>{address}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: 'var(--text-muted)' }}><PinIcon /></span>
                    Manzilni tanlash uchun xaritaga bosing
                  </div>
                )}
              </div>
            </div>

            <button className="btn btn-full" style={{ height: 52 }} disabled={!selected} onClick={() => setStep(2)}>
              Davom etish →
            </button>
          </div>
        )}

        {/* ===== STEP 2: PAYMENT ===== */}
        {step === 2 && (
          <div className="stack fade-in">
            {/* Cart summary */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Buyurtma tarkibi</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map((item) => (
                  <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.quantity} × {money(item.price)} so&apos;m</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                      {money(item.price * item.quantity)} so&apos;m
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price breakdown */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Narx tafsilotlari</h3>
              <div className="price-row">
                <span className="price-row-label">Mahsulotlar</span>
                <span className="price-row-value">{money(sub)} so&apos;m</span>
              </div>
              <div className="price-row">
                <span className="price-row-label">Yetkazib berish</span>
                <span className="price-row-value">{money(deliveryFee)} so&apos;m</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
              <div className="price-row" style={{ fontSize: 16 }}>
                <span style={{ fontWeight: 700 }}>Jami to&apos;lov</span>
                <span style={{ fontWeight: 800, fontSize: 18 }}>{money(total)} so&apos;m</span>
              </div>
            </div>

            {/* Delivery address recap */}
            <div className="card-flat" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}><PinIcon /></span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Manzil</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.5 }}>{address}</div>
              </div>
            </div>

            {/* Payment method */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>To&apos;lov usuli</h3>
              <div className="payment-methods">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    className={`payment-method-btn${paymentMethod === opt.id ? ' selected' : ''}`}
                    onClick={() => setPaymentMethod(opt.id)}
                  >
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginTop: 2 }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', color: '#991b1b', borderRadius: 12, padding: '12px 16px', fontSize: 14, fontWeight: 500, border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            <button className="btn btn-full" style={{ height: 52 }} disabled={loading} onClick={handlePlaceOrder}>
              {loading ? <><span className="spinner" /> Buyurtma berilmoqda…</> : `Buyurtma berish — ${money(total)} so'm`}
            </button>
          </div>
        )}

        {/* ===== STEP 3: SUCCESS ===== */}
        {step === 3 && (
          <div className="stack fade-in" style={{ alignItems: 'center', textAlign: 'center', paddingTop: 40 }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: 'var(--surface-alt)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text)', animation: 'checkPop 0.5s cubic-bezier(.34,1.56,.64,1) both',
              margin: '0 auto',
            }}>
              <CheckIcon />
            </div>

            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Buyurtma qabul qilindi!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                Sizning buyurtmangiz muvaffaqiyatli berildi.
              </p>
            </div>

            {orderId && (
              <div style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 24px', width: '100%' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, letterSpacing: '0.06em' }}>
                  BUYURTMA RAQAMI
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>
                  #{orderId.slice(0, 8).toUpperCase()}
                </div>
              </div>
            )}

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Buyurtma tayyorlanmoqda',
                  'Kuryer 15–30 daqiqada yetkazib beradi',
                  'SMS orqali xabar beramiz',
                ].map((text, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border-dark)', flexShrink: 0 }} />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            <button className="btn btn-full" style={{ height: 52 }} onClick={() => router.push(orderId ? `/orders/${orderId}` : '/orders')}>
              Buyurtmani kuzatish →
            </button>

            <button className="btn-ghost btn btn-full" style={{ height: 48 }} onClick={() => router.push('/home')}>
              Bosh sahifaga qaytish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
