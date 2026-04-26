'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LocationPicker } from '@/components/map/LocationPicker';
import { useCartStore } from '@/stores/cart';
import { api, money, reverseGeocode } from '@/lib/api';

type Step = 1 | 2 | 3;
type PaymentMethod = 'cash' | 'card' | 'payme' | 'click';

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'cash', label: 'Naqd pul', icon: '💵' },
  { id: 'card', label: 'Karta', icon: '💳' },
  { id: 'payme', label: 'Payme', icon: '🔵' },
  { id: 'click', label: 'Click', icon: '🟢' },
];

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="stepper">
      {([1, 2, 3] as Step[]).map((s, idx) => {
        const state = s < step ? 'done' : s === step ? 'active' : 'pending';
        return (
          <div key={s} className="stepper-step">
            <div className={`stepper-circle ${state}`}>
              {state === 'done' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                s
              )}
            </div>
            {idx < 2 && (
              <div className={`stepper-line${state === 'done' ? ' done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const STEP_TITLES: Record<Step, string> = {
  1: 'Manzil',
  2: 'To\'lov',
  3: 'Tasdiqlash',
};

// Delivery fee calculation: base 6000 + distance estimate
function calcDeliveryFee(lat: number, lng: number): number {
  // Distance from city center Tashkent
  const centerLat = 41.2995;
  const centerLng = 69.2401;
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

  // Auth guard
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) router.replace('/login');
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
    if (!token) { router.replace('/login'); return; }

    setLoading(true);
    setError('');
    try {
      // Create order
      const order = await api<{ id: string; code?: string }>('/orders', {
        method: 'POST',
        token,
        body: {
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            sellerId: i.sellerId,
          })),
          deliveryAddress: address,
          deliveryLat: selected[0],
          deliveryLng: selected[1],
          paymentMethod,
        },
      });

      // Create payment record
      try {
        await api('/payments', {
          method: 'POST',
          token,
          body: {
            orderId: order.id,
            method: paymentMethod,
            amount: total,
          },
        });
      } catch {
        // Payment endpoint optional — proceed anyway
      }

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
    <div className="page" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 16px 0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
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
        {/* =================== STEP 1: LOCATION =================== */}
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
                    <div style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Manzil aniqlanmoqda…
                  </div>
                ) : address ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📍</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>
                        Tanlangan manzil
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.5 }}>
                        {address}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>👆</span>
                    Manzilni tanlash uchun xaritaga bosing
                  </div>
                )}
              </div>
            </div>

            <button
              className="btn btn-full"
              style={{ height: 52 }}
              disabled={!selected}
              onClick={() => setStep(2)}
            >
              Davom etish →
            </button>
          </div>
        )}

        {/* =================== STEP 2: PAYMENT =================== */}
        {step === 2 && (
          <div className="stack fade-in">
            {/* Cart items summary */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
                Buyurtma tarkibi
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map((item) => (
                  <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.quantity} × {money(item.price)} so&apos;m</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                      {money(item.price * item.quantity)} so&apos;m
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price breakdown */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
                Narx tafsilotlari
              </h3>
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
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>Jami to&apos;lov</span>
                <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 18 }}>{money(total)} so&apos;m</span>
              </div>
            </div>

            {/* Delivery address recap */}
            <div className="card-flat" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20 }}>📍</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Manzil</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.5 }}>{address}</div>
              </div>
            </div>

            {/* Payment method */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
                To&apos;lov usuli
              </h3>
              <div className="payment-methods">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    className={`payment-method-btn${paymentMethod === opt.id ? ' selected' : ''}`}
                    onClick={() => setPaymentMethod(opt.id)}
                  >
                    <span style={{ fontSize: 20 }}>{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ background: 'var(--danger-light)', color: '#991b1b', borderRadius: 12, padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>
                {error}
              </div>
            )}

            <button
              className="btn btn-full"
              style={{ height: 52 }}
              disabled={loading}
              onClick={handlePlaceOrder}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Buyurtma berilmoqda…
                </>
              ) : (
                `Buyurtma berish — ${money(total)} so'm`
              )}
            </button>
          </div>
        )}

        {/* =================== STEP 3: SUCCESS =================== */}
        {step === 3 && (
          <div className="stack fade-in" style={{ alignItems: 'center', textAlign: 'center', paddingTop: 40 }}>
            <div className="success-check">✓</div>

            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
                Buyurtma qabul qilindi!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                Sizning buyurtmangiz muvaffaqiyatli berildi.
              </p>
            </div>

            {orderId && (
              <div style={{
                background: 'var(--primary-light)',
                borderRadius: 12,
                padding: '14px 24px',
                width: '100%',
              }}>
                <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>
                  BUYURTMA RAQAMI
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary-dark)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>
                  #{orderId.slice(0, 8).toUpperCase()}
                </div>
              </div>
            )}

            <div style={{ background: 'var(--surface-alt)', borderRadius: 14, padding: '16px 20px', width: '100%' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <div>📦 Buyurtma tayyorlanmoqda</div>
                <div>🛵 Kuryer 15-30 daqiqada yetkazib beradi</div>
                <div>📱 SMS orqali xabar beramiz</div>
              </div>
            </div>

            <button
              className="btn btn-full"
              style={{ height: 52 }}
              onClick={() => router.push(orderId ? `/orders/${orderId}` : '/orders')}
            >
              Buyurtmani kuzatish →
            </button>

            <button
              className="btn btn-ghost btn-full"
              style={{ height: 48 }}
              onClick={() => router.push('/home')}
            >
              Bosh sahifaga qaytish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
