'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { DeliveryTracker } from '@/components/map/DeliveryTracker';
import { Timeline, type TimelineStatus } from '@/components/Timeline';
import { api, money } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';

const SELLER_POS: [number, number] = [40.3834, 71.7833]; // Farg'ona shahar markazi
const CUSTOMER_POS: [number, number] = [40.3960, 71.8100]; // Farg'ona, Do'stlik ko'chasi

type OrderItem = {
  id: string;
  productId?: string;
  title?: string;
  product?: { title: string; price: number };
  price?: number;
  quantity: number;
  unitPrice?: number;
};

type Order = {
  id: string;
  code?: string;
  status: TimelineStatus;
  createdAt: string;
  updatedAt?: string;
  total?: number;
  totalAmount?: number;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryId?: string;
  items?: OrderItem[];
  courier?: {
    id: string;
    name?: string;
    phone?: string;
    vehicle?: string;
    rating?: number;
  };
};

const STATUS_LABELS: Record<TimelineStatus, string> = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlandi',
  preparing: 'Tayyorlanmoqda',
  picked_up: 'Kuryer oldi',
  on_the_way: 'Yo\'lda',
  delivered: 'Yetkazildi',
  cancelled: 'Bekor qilindi',
};

// Interpolate position from A to B by factor t [0..1]
function lerp(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLng = (b[1] - a[1]) * Math.PI / 180;
  const lat1 = a[0] * Math.PI / 180;
  const lat2 = b[0] * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(x));
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('uz-UZ', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch { return iso; }
}

export default function OrderTrackingPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courierPos, setCourierPos] = useState<[number, number]>(SELLER_POS);
  const [eta, setEta] = useState<number | null>(null);
  const deliveryIdRef = useRef<string | null>(null);

  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(0);

  // Auth guard
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.replace('/login'); return; }
  }, [router]);

  // Fetch order
  const fetchOrder = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const data = await api<Order>(`/orders/${id}`, { token });
      setOrder(data);
      if (data.deliveryId) deliveryIdRef.current = data.deliveryId;
      setLoading(false);
    } catch {
      // Use demo order
      setOrder({
        id,
        code: `ORD-${id.slice(0, 6).toUpperCase()}`,
        status: 'on_the_way',
        createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        total: 78000,
        deliveryAddress: "Farg'ona, Mustaqillik ko'chasi 42-uy",
        items: [
          { id: '1', title: 'Osh (plov)', price: 35000, quantity: 2, unitPrice: 35000 },
          { id: '2', title: 'Lag\'mon', price: 25000, quantity: 1, unitPrice: 25000 },
        ],
        courier: {
          id: 'c1',
          name: 'Jasur Toshmatov',
          phone: '+998 90 123 45 67',
          vehicle: 'Moped',
          rating: 4.9,
        },
      });
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // WebSocket connection + courier simulation
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    let wsConnected = false;
    try {
      const socket = connectSocket(token);

      socket.on('connect', () => {
        wsConnected = true;
        // Join order room for status updates
        socket.emit('order:join', { orderId: id });
        // Join delivery room for location updates (if deliveryId available)
        const dId = deliveryIdRef.current;
        if (dId) socket.emit('delivery:join', { deliveryId: dId });
      });

      socket.on('order:status', (data: { orderId: string; status: TimelineStatus }) => {
        if (data.orderId === id) {
          setOrder((prev) => prev ? { ...prev, status: data.status } : prev);
        }
      });

      // Real-time courier location from backend
      socket.on('delivery:location', (data: { deliveryId: string; lat: number; lng: number }) => {
        if (!data.lat || !data.lng) return;
        setCourierPos([data.lat, data.lng]);
        if (simulationRef.current) {
          clearInterval(simulationRef.current);
          simulationRef.current = null;
        }
      });

      // Start simulation after 2s if WS doesn't connect
      const wsCheck = setTimeout(() => {
        if (!wsConnected) startSimulation();
      }, 2000);

      socket.on('connect_error', () => {
        if (!wsConnected) startSimulation();
      });

      return () => {
        clearTimeout(wsCheck);
        socket.off('connect');
        socket.off('order:status');
        socket.off('delivery:location');
        disconnectSocket();
        if (simulationRef.current) clearInterval(simulationRef.current);
      };
    } catch {
      startSimulation();
      return () => {
        if (simulationRef.current) clearInterval(simulationRef.current);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const startSimulation = useCallback(() => {
    if (simulationRef.current) return; // already running
    progressRef.current = 0;

    simulationRef.current = setInterval(() => {
      progressRef.current = Math.min(progressRef.current + 0.003, 1);
      const pos = lerp(SELLER_POS, CUSTOMER_POS, progressRef.current);
      setCourierPos(pos);

      // ETA (seconds remaining)
      const remaining = Math.round((1 - progressRef.current) * 18 * 60);
      setEta(remaining);

      if (progressRef.current >= 1) {
        clearInterval(simulationRef.current!);
        simulationRef.current = null;
        setOrder((prev) => prev ? { ...prev, status: 'delivered' } : prev);
        setEta(0);
      }
    }, 300);
  }, []);

  const formatEta = (seconds: number) => {
    if (seconds <= 0) return 'Yetib keldi!';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `~${m} daq ${s > 0 ? s + ' son' : ''}` : `~${s} son`;
  };

  const getDestination = (): [number, number] => {
    if (order?.deliveryLat && order?.deliveryLng) {
      return [order.deliveryLat, order.deliveryLng];
    }
    return CUSTOMER_POS;
  };

  const total = order?.total ?? order?.totalAmount ?? 0;

  if (loading) {
    return (
      <div className="page">
        <div style={{ padding: 16 }}>
          <div className="skeleton" style={{ height: 340, marginBottom: 16 }} />
          <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 10 }} />
          <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: 8 }} />
          <div className="skeleton skeleton-text" style={{ width: '50%' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div style={{ padding: 16, textAlign: 'center' }}>
          <p style={{ color: 'var(--danger)' }}>{error}</p>
          <Link href="/orders">
            <button className="btn" style={{ marginTop: 16 }}>Buyurtmalarga qaytish</button>
          </Link>
        </div>
      </div>
    );
  }

  const isActiveOrder = order && ['confirmed', 'preparing', 'picked_up', 'on_the_way'].includes(order.status);
  const isDelivered = order?.status === 'delivered';

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, lineHeight: 1, color: 'var(--text)', padding: 4 }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>
            {order?.code ?? `#${id.slice(0, 8).toUpperCase()}`}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {order?.createdAt ? formatDate(order.createdAt) : ''}
          </div>
        </div>
        {order?.status && (
          <span className={`chip ${order.status === 'delivered' ? 'chip-green' : order.status === 'cancelled' ? 'chip-rose' : 'chip-indigo'}`}>
            {STATUS_LABELS[order.status]}
          </span>
        )}
      </div>

      {/* LIVE MAP */}
      {isActiveOrder && (
        <div style={{ padding: '0 0 0 0' }}>
          <DeliveryTracker
            courierPos={courierPos}
            destination={getDestination()}
            sellerPos={SELLER_POS}
          />
        </div>
      )}

      {/* Delivered success banner */}
      {isDelivered && (
        <div style={{
          background: 'var(--primary-light)',
          padding: '20px 16px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{ fontSize: 48 }}>🎉</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary-dark)' }}>Buyurtma yetkazildi!</div>
          <div style={{ fontSize: 14, color: 'var(--primary)' }}>Tabriklaymiz! Xaridingiz muvaffaqiyatli yakunlandi</div>
        </div>
      )}

      <div style={{ padding: '16px', maxWidth: 680, margin: '0 auto', width: '100%', flex: 1 }}>
        {/* ETA + Distance card */}
        {isActiveOrder && (
          <div style={{
            marginBottom: 16,
            background: 'var(--primary)',
            borderRadius: 18, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 0,
          }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>MASOFA</div>
              {(() => {
                const dest = getDestination();
                const km = haversineKm(courierPos, dest);
                return (
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                    {km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`}
                  </div>
                );
              })()}
            </div>
            <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,.25)', flexShrink: 0 }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>YETIB KELISH</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {eta !== null && eta > 0 ? formatEta(eta) : '🛵 Yo\'lda'}
              </div>
            </div>
            <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,.25)', flexShrink: 0 }} />
            <div style={{ flex: 0.7, textAlign: 'center' }}>
              <div style={{ fontSize: 32, animation: 'pulse 1.5s ease-in-out infinite' }}>🛵</div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Buyurtma holati</h3>
          {order && (
            <Timeline
              status={order.status}
              timestamps={
                order.createdAt
                  ? { confirmed: formatDate(order.createdAt) }
                  : undefined
              }
            />
          )}
        </div>

        {/* Order items */}
        {order?.items && order.items.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Buyurtma tarkibi</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {order.items.map((item) => {
                const name = item.title ?? item.product?.title ?? 'Mahsulot';
                const price = item.price ?? item.unitPrice ?? item.product?.price ?? 0;
                return (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {item.quantity} × {money(price)} so&apos;m
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                      {money(price * item.quantity)} so&apos;m
                    </div>
                  </div>
                );
              })}
            </div>
            {total > 0 && (
              <>
                <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Jami</span>
                  <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>{money(total)} so&apos;m</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Delivery address */}
        {order?.deliveryAddress && (
          <div className="card-flat" style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start', padding: '14px 16px' }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>📍</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Yetkazish manzili</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{order.deliveryAddress}</div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="stack" style={{ gap: 10, marginBottom: 24 }}>
          {isDelivered && (
            <Link href="/home" style={{ display: 'block' }}>
              <button className="btn btn-full" style={{ height: 50 }}>
                Qayta buyurtma berish
              </button>
            </Link>
          )}
          <Link href="/orders" style={{ display: 'block' }}>
            <button className="btn btn-ghost btn-full" style={{ height: 46 }}>
              Barcha buyurtmalar
            </button>
          </Link>
        </div>
      </div>

      {/* Courier info bar — shown when courier is on the way */}
      {isActiveOrder && order?.courier && (
        <div className="courier-bar" style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 80,
        }}>
          <div className="courier-avatar">🧑</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {order.courier.name ?? 'Kuryer'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {order.courier.vehicle && (
                <span>🛵 {order.courier.vehicle}</span>
              )}
              {order.courier.rating && (
                <span>⭐ {order.courier.rating.toFixed(1)}</span>
              )}
            </div>
          </div>
          {order.courier.phone && (
            <a href={`tel:${order.courier.phone.replace(/\s/g, '')}`}>
              <button className="btn" style={{ width: 48, height: 48, padding: 0, flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11 19.79 19.79 0 01.01 2.34 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.9z" />
                </svg>
              </button>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
