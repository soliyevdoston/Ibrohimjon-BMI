'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LocationPicker } from '@/components/map/LocationPicker';
import { useCartStore } from '@/stores/cart';
import { api, money, reverseGeocode } from '@/lib/api';
import type { PickupPoint } from '@/lib/locations';

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

// These rates mirror the backend's PlatformConfig defaults so the customer
// preview lines up with what the backend will charge. Tiered by total order
// weight: BIKE → CAR → VAN → TRUCK (mebel/qurilish).
type Vehicle = 'BIKE' | 'CAR' | 'VAN' | 'TRUCK';
const SERVICE_FEE_RATE = 0.02;

const TIER_RATES: Record<Vehicle, { base: number; perKm: number; maxKg: number; label: string; icon: string }> = {
  BIKE:  { base: 6000,  perKm: 1400, maxKg: 10,        label: 'Velosipid',     icon: '🚲' },
  CAR:   { base: 15000, perKm: 2000, maxKg: 50,        label: 'Avto',          icon: '🚗' },
  VAN:   { base: 35000, perKm: 3500, maxKg: 300,       label: 'Furgon',        icon: '🚐' },
  TRUCK: { base: 70000, perKm: 5500, maxKg: Infinity,  label: 'Yuk mashinasi', icon: '🚛' },
};

const VEHICLE_RANK: Record<Vehicle, number> = { BIKE: 0, CAR: 1, VAN: 2, TRUCK: 3 };

function pickVehicle(weightKg: number, hint: Vehicle = 'BIKE'): Vehicle {
  let byWeight: Vehicle = 'BIKE';
  if (weightKg > TIER_RATES.VAN.maxKg) byWeight = 'TRUCK';
  else if (weightKg > TIER_RATES.CAR.maxKg) byWeight = 'VAN';
  else if (weightKg > TIER_RATES.BIKE.maxKg) byWeight = 'CAR';
  return VEHICLE_RANK[hint] >= VEHICLE_RANK[byWeight] ? hint : byWeight;
}

function calcDistanceKm(lat: number, lng: number): number {
  const centerLat = 41.2995, centerLng = 69.2401;
  const kmLat = Math.abs(lat - centerLat) * 111;
  const kmLng = Math.abs(lng - centerLng) * 85;
  return Math.sqrt(kmLat * kmLat + kmLng * kmLng);
}

function calcDeliveryFee(lat: number, lng: number, vehicle: Vehicle): number {
  const km = calcDistanceKm(lat, lng);
  const t = TIER_RATES[vehicle];
  return Math.round(t.base + km * t.perKm);
}

function calcServiceFee(subtotal: number): number {
  return Math.round(subtotal * SERVICE_FEE_RATE);
}

interface SavedCard {
  id: string;
  last4: string;
  holderName: string;
  provider: 'UZCARD' | 'HUMO' | 'VISA' | 'MASTERCARD' | 'UNKNOWN';
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clear } = useCartStore();

  const [step, setStep] = useState<Step>(1);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [pickup, setPickup] = useState<PickupPoint | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) router.replace('/login?redirect=/checkout');
    if (items.length === 0 && step === 1) router.replace('/home');
  }, [items.length, router, step]);

  // Load saved cards once a token is available; used when 'card' is picked.
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    api<SavedCard[]>('/customer/cards', { token })
      .then((list) => {
        setSavedCards(list);
        const def = list.find((c) => c.isDefault) ?? list[0];
        if (def) setSelectedCardId(def.id);
      })
      .catch(() => {/* ignore — cards optional */});
  }, []);

  const handleMapSelect = useCallback(async (lat: number, lng: number) => {
    setSelected([lat, lng]);
    setPickup(null);
    setLoadingAddress(true);
    try {
      const addr = await reverseGeocode(lat, lng);
      setAddress(addr);
    } finally {
      setLoadingAddress(false);
    }
  }, []);

  const handlePickupSelect = useCallback((p: PickupPoint) => {
    setSelected([p.lat, p.lng]);
    setPickup(p);
    setAddress(`${p.name} — ${p.address}, ${p.district}`);
    setLoadingAddress(false);
  }, []);

  // Total weight + vehicle hint from cart items
  const totalWeightKg = items.reduce(
    (acc, i) => acc + (i.weightKg ?? 1) * i.quantity,
    0,
  );
  const vehicleHint = items.reduce<Vehicle>((acc, i) => {
    const v = (i.requiresVehicle ?? 'BIKE') as Vehicle;
    return VEHICLE_RANK[v] > VEHICLE_RANK[acc] ? v : acc;
  }, 'BIKE');
  const requiredVehicle = pickVehicle(totalWeightKg, vehicleHint);
  const tier = TIER_RATES[requiredVehicle];

  const deliveryFee = pickup
    ? 0
    : selected
      ? calcDeliveryFee(selected[0], selected[1], requiredVehicle)
      : tier.base + Math.round(2 * tier.perKm); // ~2km placeholder
  const sub = subtotal();
  const serviceFee = calcServiceFee(sub);
  const total = sub + deliveryFee + serviceFee;

  const handlePlaceOrder = async () => {
    if (!selected) return;
    if (items.length === 0) { setError('Savatda mahsulot yo\'q'); return; }
    const token = localStorage.getItem('access_token');
    if (!token) { router.replace('/login?redirect=/checkout'); return; }

    // Backend expects: one sellerId per order, items without sellerId, deliveryAddressText, idempotencyKey
    const sellerId = items[0].sellerId;
    if (!sellerId) { setError('Sotuvchi aniqlanmadi'); return; }
    const idempotencyKey = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    if (paymentMethod === 'card' && !selectedCardId) {
      setError('Karta tanlang yoki yangi karta qo`shing');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const order = await api<{ id: string }>('/orders', {
        method: 'POST', token,
        body: {
          sellerId,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          deliveryAddressText: address || 'Toshkent',
          deliveryLat: selected[0],
          deliveryLng: selected[1],
          paymentMethod,
          customerCardId: paymentMethod === 'card' ? selectedCardId : undefined,
          idempotencyKey,
        },
      });

      // Only initialize gateway flow for non-cash methods. Cash orders settle
      // automatically when the courier marks delivery DELIVERED.
      if (paymentMethod !== 'cash') {
        try {
          await api('/payments/create', {
            method: 'POST', token,
            body: { orderId: order.id },
          });
        } catch { /* gateway init optional in dev */ }
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

              <LocationPicker
                selected={selected}
                onSelect={handleMapSelect}
                onPickupSelect={handlePickupSelect}
              />

              <div style={{ padding: '14px 16px 16px' }}>
                {loadingAddress ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 14 }}>
                    <div style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--text)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Manzil aniqlanmoqda…
                  </div>
                ) : address ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{
                      flexShrink: 0,
                      marginTop: 1,
                      fontSize: 16,
                      color: pickup ? '#06b6d4' : 'var(--text)',
                    }}>{pickup ? '📦' : <PinIcon />}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: pickup ? '#0e7490' : 'var(--text)',
                        lineHeight: 1.4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        {pickup ? 'Olib ketish punkti' : 'Yetkazib berish manzili'}
                        {pickup && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 999,
                            background: '#cffafe',
                            color: '#0e7490',
                            textTransform: 'uppercase',
                            letterSpacing: 0.4,
                          }}>
                            Bepul
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.5 }}>{address}</div>
                      {pickup && (
                        <div style={{ fontSize: 11, color: '#0891b2', marginTop: 4, display: 'flex', gap: 10 }}>
                          <span>🕒 {pickup.hours}</span>
                          <span>📍 {pickup.district}</span>
                        </div>
                      )}
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
              {requiredVehicle !== 'BIKE' && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', marginBottom: 10,
                  background: 'linear-gradient(135deg, #f1f5f9, #e0e7ff)',
                  borderRadius: 12, border: '1px solid #c7d2fe',
                }}>
                  <span style={{ fontSize: 22 }}>{tier.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                      {tier.label} kerak
                    </div>
                    <div style={{ fontSize: 11, color: '#475569' }}>
                      Buyurtma og&apos;irligi ~{Math.round(totalWeightKg)} kg · {requiredVehicle === 'TRUCK' ? 'yuk mashinasi tariflari amal qiladi' : 'kattaroq transport tariflari'}
                    </div>
                  </div>
                </div>
              )}

              <div className="price-row">
                <span className="price-row-label">Mahsulotlar</span>
                <span className="price-row-value">{money(sub)} so&apos;m</span>
              </div>
              <div className="price-row">
                <span className="price-row-label">
                  Yetkazib berish
                  {pickup && <span style={{ color: '#10b981', fontSize: 11, marginLeft: 6 }}>(olib ketish)</span>}
                  {!pickup && requiredVehicle !== 'BIKE' && (
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 6 }}>
                      ({tier.icon} {tier.label})
                    </span>
                  )}
                </span>
                <span className="price-row-value">{deliveryFee === 0 ? 'Bepul' : `${money(deliveryFee)} so'm`}</span>
              </div>
              <div className="price-row">
                <span className="price-row-label" title="Platforma servis to'lovi">
                  Servis to&apos;lovi <span style={{ color: '#9ca3af', fontSize: 11, marginLeft: 4 }}>(2%)</span>
                </span>
                <span className="price-row-value">{money(serviceFee)} so&apos;m</span>
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

              {paymentMethod === 'card' && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                  {savedCards.length > 0 ? (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>
                        SAQLANGAN KARTALAR
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {savedCards.map((c) => {
                          const sel = selectedCardId === c.id;
                          return (
                            <button
                              key={c.id}
                              onClick={() => setSelectedCardId(c.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '12px 14px', borderRadius: 12,
                                border: `1.5px solid ${sel ? 'var(--text)' : 'var(--border)'}`,
                                background: sel ? 'var(--surface-alt)' : 'var(--surface)',
                                cursor: 'pointer', textAlign: 'left', width: '100%',
                              }}
                            >
                              <span style={{ fontSize: 18 }}>💳</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700 }}>
                                  {c.provider === 'UNKNOWN' ? 'Karta' : c.provider} •••• {c.last4}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                  {c.holderName} · {String(c.expiryMonth).padStart(2, '0')}/{String(c.expiryYear).slice(-2)}
                                </div>
                              </div>
                              {sel && <span style={{ color: 'var(--text)' }}><CheckIcon /></span>}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => router.push('/profile/cards')}
                        style={{
                          marginTop: 10, width: '100%', padding: '10px',
                          background: 'transparent', border: '1px dashed var(--border)',
                          borderRadius: 10, fontSize: 13, fontWeight: 600,
                          color: 'var(--text)', cursor: 'pointer',
                        }}
                      >
                        + Yangi karta qo&apos;shish
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => router.push('/profile/cards')}
                      style={{
                        width: '100%', padding: '14px',
                        background: 'var(--surface-alt)', border: '1px dashed var(--border)',
                        borderRadius: 12, fontSize: 13, fontWeight: 600,
                        color: 'var(--text)', cursor: 'pointer',
                      }}
                    >
                      💳 Karta qo&apos;shing va shu yerda to&apos;lang
                    </button>
                  )}
                </div>
              )}
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
