'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CourierMap } from '@/components/map/CourierMap';
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

const STATUS_COLORS: Record<DeliveryStatus, string> = {
  accepted: 'indigo', picked_up: 'amber', on_the_way: 'sky', delivered: 'green',
};

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
      <div style={{ background: 'var(--canvas)', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(160deg, #1e1b4b 0%, #4f46e5 100%)',
          padding: '48px 20px 24px',
          paddingTop: `max(48px, calc(env(safe-area-inset-top) + 24px))`,
          color: '#fff',
        }}>
          <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h1 style={{ color: '#fff', fontSize: 20, marginBottom: 2 }}>Hello, Courier! 👋</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                {isOnline ? '🟢 Online — accepting orders' : '⚫ Offline'}
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
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Today', value: '7' },
              { label: 'Earnings', value: '84,000' },
              { label: 'Rating', value: '4.9 ★' },
            ].map((s) => (
              <div key={s.label} style={{
                flex: 1, background: 'rgba(255,255,255,0.12)', borderRadius: 12,
                padding: '10px 12px', backdropFilter: 'blur(8px)',
              }}>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginBottom: 2 }}>{s.label}</div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{s.value}</div>
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
              <div className="empty-ico">🔌</div>
              <strong>You are offline</strong>
              <p>Toggle online to start receiving orders</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty">
              <div className="empty-ico">📭</div>
              <strong>No orders nearby</strong>
              <p>Stay in your zone — new orders appear automatically</p>
            </div>
          ) : (
            <div className="stack">
              {orders.map((order) => (
                <div key={order.id} className="order-card fade-in">
                  <div className="hstack" style={{ justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: 15 }}>{order.code}</strong>
                    <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: 16 }}>
                      +{money(order.earnings)} so'm
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="hstack">
                      <span style={{ fontSize: 18 }}>🏪</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{order.sellerName}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{order.sellerAddress}</div>
                      </div>
                    </div>
                    <div style={{ borderLeft: '2px dashed var(--border)', marginLeft: 9, paddingLeft: 17, height: 12 }} />
                    <div className="hstack">
                      <span style={{ fontSize: 18 }}>🏠</span>
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
                      Pass
                    </button>
                    <button
                      className="btn success"
                      style={{ flex: 3, minHeight: 44 }}
                      onClick={() => handleAccept(order)}
                      disabled={loadingId === order.id}
                    >
                      {loadingId === order.id ? 'Accepting…' : '✓ Accept Order'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
            width: 36, height: 36, borderRadius: 10, background: 'var(--primary-50)',
            display: 'grid', placeItems: 'center', fontSize: 18, flex: 'none',
          }}>
            {deliveryStatus === 'delivered' ? '✅' : '🛵'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{activeDelivery.code}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {currentStep?.label ?? 'Delivery'}
            </div>
          </div>
          <span className={`chip ${STATUS_COLORS[deliveryStatus]}`}>
            {deliveryStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        </div>
      </div>

      {/* BOTTOM ACTION PANEL */}
      {showPanel && (
        <div className="map-action-panel">
          {deliveryStatus === 'delivered' ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
              <h2 style={{ fontSize: 20, marginBottom: 4 }}>Order Delivered!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
                Earnings: <strong style={{ color: 'var(--success)' }}>+{money(activeDelivery.earnings)} so'm</strong>
              </p>
              <button className="btn success full" onClick={() => setActiveDelivery(null)}>
                Accept next order
              </button>
            </div>
          ) : (
            <div className="stack-sm">
              {/* Route summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="hstack">
                  <span style={{ fontSize: 18 }}>🏪</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{activeDelivery.sellerName}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{activeDelivery.sellerAddress}</div>
                  </div>
                </div>
                <div style={{ borderLeft: '2px dashed var(--border)', marginLeft: 9, paddingLeft: 17, height: 8 }} />
                <div className="hstack">
                  <span style={{ fontSize: 18 }}>🏠</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>Customer</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{activeDelivery.customerAddress}</div>
                  </div>
                </div>
              </div>

              <hr className="divider" />

              {/* Main action button */}
              {currentStep && currentStep.nextStatus && (
                <button
                  className="btn success full"
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
