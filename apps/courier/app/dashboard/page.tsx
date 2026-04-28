'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CourierMap } from '@/components/map/CourierMap';
import { CourierBottomNav } from '@/components/BottomNav';
import { IconStore, IconHome, IconMapPin, IconCheck, IconScooter } from '@/components/Icons';
import { api, money } from '@/lib/api';
import { startSimulatedTracking, sendLocationToBackend } from '@/lib/gps';
import { io, Socket } from 'socket.io-client';

/* ── Types ── */
type AvailableOrder = {
  id: string; code: string; sellerName: string; sellerAddress: string;
  customerAddress: string; distanceKm: number; estimatedMinutes: number;
  earnings: number;
  sellerPos: [number, number]; customerPos: [number, number];
};
type DeliveryStatus = 'accepted' | 'picked_up' | 'on_the_way' | 'delivered';

/* ── Demo data ── */
const DEMO_ORDERS: AvailableOrder[] = [
  {
    id: 'd1', code: 'ORD-128', sellerName: 'Toshkent Nonvoyxonasi',
    sellerAddress: 'Yunusobod, Toshkent', customerAddress: 'Chilonzor, Toshkent',
    distanceKm: 3.2, estimatedMinutes: 18, earnings: 12000,
    sellerPos: [41.310, 69.281], customerPos: [41.285, 69.220],
  },
  {
    id: 'd2', code: 'ORD-129', sellerName: 'Samarqand Go\'shti',
    sellerAddress: 'Mirzo Ulugbek, Toshkent', customerAddress: 'Shayxontohur, Toshkent',
    distanceKm: 5.1, estimatedMinutes: 27, earnings: 18000,
    sellerPos: [41.320, 69.310], customerPos: [41.300, 69.255],
  },
  {
    id: 'd3', code: 'ORD-130', sellerName: 'Farida\'s Kitchen',
    sellerAddress: 'Olmazor, Toshkent', customerAddress: 'Sergeli, Toshkent',
    distanceKm: 6.8, estimatedMinutes: 35, earnings: 22000,
    sellerPos: [41.340, 69.240], customerPos: [41.260, 69.215],
  },
];

const STATUS_STEPS: { status: DeliveryStatus; label: string; nextLabel: string; nextStatus: DeliveryStatus | null }[] = [
  { status: 'accepted',    label: 'Going to pickup',  nextLabel: 'Picked up',     nextStatus: 'picked_up' },
  { status: 'picked_up',  label: 'Order picked up',   nextLabel: 'Start delivery', nextStatus: 'on_the_way' },
  { status: 'on_the_way', label: 'On the way',         nextLabel: 'Delivered ✓',   nextStatus: 'delivered' },
  { status: 'delivered',  label: 'Delivered!',          nextLabel: '',              nextStatus: null },
];


function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLng = (b[1] - a[1]) * Math.PI / 180;
  const lat1 = a[0] * Math.PI / 180;
  const lat2 = b[0] * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(x));
}

function etaLabel(km: number): string {
  const minutes = Math.round((km / 25) * 60); // assume ~25 km/h
  if (minutes <= 0) return 'Yetib keldim!';
  if (minutes < 60) return `~${minutes} daq`;
  return `~${Math.floor(minutes / 60)}h ${minutes % 60}daq`;
}

export default function CourierDashboard() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [orders, setOrders] = useState<AvailableOrder[]>(DEMO_ORDERS);
  const [activeDelivery, setActiveDelivery] = useState<AvailableOrder | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>('accepted');
  const [courierPos, setCourierPos] = useState<[number, number]>([41.2995, 69.2401]);
  const [showPanel, setShowPanel] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const gpsCleanupRef = useRef<(() => void) | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { router.replace('/login'); return; }
    const socket = io(`${process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000'}/realtime`, {
      auth: { token }, transports: ['websocket'], reconnectionDelay: 2000,
    });
    socketRef.current = socket;
    socket.on('order:new', (order: AvailableOrder) => {
      setOrders((prev) => [order, ...prev]);
    });
    return () => { socket.disconnect(); };
  }, [router, token]);

  const startGPS = useCallback((delivery: AvailableOrder) => {
    const from = delivery.sellerPos;
    const to = delivery.customerPos;
    setCourierPos(from);

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCourierPos([lat, lng]);
          sendLocationToBackend(lat, lng, delivery.id, token);
        },
        () => {
          const cleanup = startSimulatedTracking(
            (lat, lng) => { setCourierPos([lat, lng]); sendLocationToBackend(lat, lng, delivery.id, token); },
            from, to, 4000, 60
          );
          gpsCleanupRef.current = cleanup;
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );
      gpsCleanupRef.current = () => navigator.geolocation.clearWatch(watchId);
    } else {
      const cleanup = startSimulatedTracking(
        (lat, lng) => { setCourierPos([lat, lng]); sendLocationToBackend(lat, lng, delivery.id, token); },
        from, to, 4000, 60
      );
      gpsCleanupRef.current = cleanup;
    }
  }, [token]);

  const handleAccept = async (order: AvailableOrder) => {
    setLoadingId(order.id);
    try {
      await api(`/deliveries/${order.id}/accept`, { method: 'POST', token });
      setActiveDelivery(order);
      setDeliveryStatus('accepted');
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      startGPS(order);
    } catch {
      setActiveDelivery(order);
      setDeliveryStatus('accepted');
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      startGPS(order);
    } finally { setLoadingId(null); }
  };

  const handleStatusUpdate = async (nextStatus: DeliveryStatus | null) => {
    if (!nextStatus || !activeDelivery) return;
    try {
      await api(`/deliveries/${activeDelivery.id}/status`, {
        method: 'PATCH', body: { status: nextStatus.toUpperCase() }, token,
      });
    } catch {/* update locally anyway */}
    setDeliveryStatus(nextStatus);
    if (nextStatus === 'delivered') {
      gpsCleanupRef.current?.();
      gpsCleanupRef.current = null;
      setTimeout(() => { setActiveDelivery(null); }, 3000);
    }
  };

  const currentStep = STATUS_STEPS.find((s) => s.status === deliveryStatus)!;

  /* ── Available orders view ── */
  if (!activeDelivery) {
    return (
      <div style={{ background: 'var(--canvas)', minHeight: '100dvh', paddingBottom: 80 }}>
        {/* Header */}
        <div style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '48px 20px 20px',
          paddingTop: `max(48px, calc(env(safe-area-inset-top) + 24px))`,
        }}>
          <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 20, marginBottom: 2 }}>Kuryerlik paneli</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {isOnline ? '● Onlayn — buyurtmalar qabul qilinmoqda' : '○ Offlayn'}
              </p>
            </div>
            <div
              className={`toggle ${isOnline ? 'on' : ''}`}
              onClick={() => setIsOnline(!isOnline)}
              style={{ cursor: 'pointer' }}
            >
              <div className="toggle-thumb" />
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'Bugun', value: '7' },
              { label: 'Daromad', value: "84,000 so'm" },
              { label: 'Reyting', value: '4.9' },
            ].map((s) => (
              <div key={s.label} style={{
                flex: 1, background: 'var(--surface-2)', borderRadius: 12,
                padding: '10px 12px', border: '1px solid var(--border)',
              }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders list */}
        <div className="page" style={{ paddingTop: 20 }}>
          <div className="hstack" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 17 }}>Available Orders</h2>
            <div className="spacer" />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{orders.length} nearby</span>
          </div>

          {!isOnline ? (
            <div className="empty">
              <strong>Siz offlayn holatdasiz</strong>
              <p>Buyurtmalar qabul qilish uchun onlayn rejimga o&apos;ting</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty">
              <strong>Yaqin atrofda buyurtmalar yo&apos;q</strong>
              <p>Zonangizda qoling — yangi buyurtmalar avtomatik keladi</p>
            </div>
          ) : (
            <div className="stack">
              {orders.map((order) => (
                <div key={order.id} className="order-card fade-in">
                  <div className="hstack" style={{ justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: 15 }}>{order.code}</strong>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>
                      +{money(order.earnings)} so&apos;m
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="hstack">
                      <div style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--text-muted)' }}>
                        <IconStore size={18} stroke={1.6} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{order.sellerName}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{order.sellerAddress}</div>
                      </div>
                    </div>
                    <div style={{ borderLeft: '2px dashed var(--border)', marginLeft: 9, paddingLeft: 17, height: 12 }} />
                    <div className="hstack">
                      <div style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--text-muted)' }}>
                        <IconHome size={18} stroke={1.6} />
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{order.customerAddress}</div>
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--surface-2)', borderRadius: 10, padding: '8px 12px',
                    display: 'flex', gap: 16,
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Distance</div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{order.distanceKm} km</div>
                    </div>
                    <div style={{ width: 1, background: 'var(--border)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Est. time</div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{order.estimatedMinutes} min</div>
                    </div>
                  </div>

                  <div className="hstack" style={{ gap: 10 }}>
                    <button
                      className="btn ghost sm"
                      style={{ flex: 1 }}
                      onClick={() => setOrders((prev) => prev.filter((o) => o.id !== order.id))}
                    >
                      O&apos;tkazib yuborish
                    </button>
                    <button
                      className="btn"
                      style={{ flex: 3, minHeight: 44 }}
                      onClick={() => handleAccept(order)}
                      disabled={loadingId === order.id}
                    >
                      {loadingId === order.id ? 'Qabul qilinmoqda…' : 'Qabul qilish'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <CourierBottomNav />
      </div>
    );
  }

  /* ── Active delivery view — full screen map ── */
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      {/* FULL SCREEN MAP */}
      <div className="map-fullscreen">
        <CourierMap
          courierPos={courierPos}
          sellerPos={activeDelivery.sellerPos}
          customerPos={activeDelivery.customerPos}
          autofit={deliveryStatus === 'accepted'}
        />
      </div>

      {/* TOP OVERLAY — order info */}
      <div className="map-overlay-top">
        <div className="status-bar">
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            display: 'grid', placeItems: 'center', flex: 'none',
            color: 'var(--text)',
          }}>
            {deliveryStatus === 'delivered'
              ? <IconCheck size={18} stroke={2.2} />
              : <IconScooter size={18} stroke={1.6} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{activeDelivery.code}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {currentStep?.label ?? 'Delivery'}
            </div>
          </div>
          <span className="chip gray">
            {deliveryStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        </div>
      </div>

      {/* BOTTOM ACTION PANEL */}
      {showPanel && (
        <div className="map-action-panel">
          {deliveryStatus === 'delivered' ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18, background: 'var(--surface-2)',
                border: '1px solid var(--border)', display: 'grid', placeItems: 'center',
                margin: '0 auto 12px', color: 'var(--text)',
              }}>
                <IconCheck size={28} stroke={2} />
              </div>
              <h2 style={{ fontSize: 20, marginBottom: 4 }}>Yetkazildi!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
                Daromad: <strong>+{money(activeDelivery.earnings)} so&apos;m</strong>
              </p>
              <button className="btn full" onClick={() => setActiveDelivery(null)}>
                Keyingi buyurtmani qabul qilish
              </button>
            </div>
          ) : (
            <div className="stack-sm">
              {/* Live distance + ETA strip */}
              {(() => {
                const target = deliveryStatus === 'accepted' || deliveryStatus === 'picked_up'
                  ? activeDelivery.sellerPos
                  : activeDelivery.customerPos;
                const distKm = haversineKm(courierPos, target);
                return (
                  <div style={{
                    background: 'var(--text)',
                    borderRadius: 14, padding: '12px 16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', fontWeight: 600, marginBottom: 2 }}>MASOFA</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                        {distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`}
                      </div>
                    </div>
                    <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,.2)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', fontWeight: 600, marginBottom: 2 }}>YETIB KELISH</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                        {etaLabel(distKm)}
                      </div>
                    </div>
                    <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,.2)' }} />
                    <div style={{ textAlign: 'center', color: '#fff' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', fontWeight: 600, marginBottom: 4 }}>MANZIL</div>
                      {deliveryStatus === 'accepted' || deliveryStatus === 'picked_up'
                        ? <IconStore size={18} stroke={1.6} />
                        : <IconHome size={18} stroke={1.6} />}
                    </div>
                  </div>
                );
              })()}

              {/* Route summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="hstack">
                  <div style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--text-muted)' }}>
                    <IconStore size={18} stroke={1.6} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{activeDelivery.sellerName}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{activeDelivery.sellerAddress}</div>
                  </div>
                </div>
                <div style={{ borderLeft: '2px dashed var(--border)', marginLeft: 9, paddingLeft: 17, height: 8 }} />
                <div className="hstack">
                  <div style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--text-muted)' }}>
                    <IconHome size={18} stroke={1.6} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>Mijoz</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{activeDelivery.customerAddress}</div>
                  </div>
                </div>
              </div>

              <hr className="divider" />

              {/* Main action button */}
              {currentStep && currentStep.nextStatus && (
                <button
                  className="btn full"
                  onClick={() => handleStatusUpdate(currentStep.nextStatus)}
                >
                  {currentStep.nextLabel}
                </button>
              )}

              <button
                className="btn ghost sm full"
                style={{ fontSize: 13 }}
                onClick={() => setShowPanel(false)}
              >
                Hide panel (tap map to show)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tap to show panel again when hidden */}
      {!showPanel && (
        <button
          onClick={() => setShowPanel(true)}
          style={{
            position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.95)', border: '1px solid var(--border)',
            borderRadius: 999, padding: '10px 20px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', zIndex: 30, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(8px)',
          }}
        >
          Show order panel ↑
        </button>
      )}
    </div>
  );
}
