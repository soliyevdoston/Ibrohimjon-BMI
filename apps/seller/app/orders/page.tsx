'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SellerSidebar } from '@/components/Sidebar';
import { SellerTopbar } from '@/components/Topbar';
import { SellerDeliveryTracker } from '@/components/map/SellerDeliveryTracker';
import { api, money, timeAgo } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

type OrderItem = { id: string; titleSnapshot: string; quantity: number; priceSnapshot: number };
type AvailableCourier = {
  id: string;
  vehicleType: string;
  vehicleModel?: string | null;
  vehiclePlate?: string | null;
  user?: { fullName?: string | null; phone?: string | null };
};
type Order = {
  id: string; code: string; status: string;
  customerName: string; totalAmount: number; createdAt: string;
  items: OrderItem[]; deliveryAddressText: string;
  requiredVehicle?: 'BIKE' | 'CAR' | 'VAN' | 'TRUCK';
  sellerPos?: [number, number];
  customerPos?: [number, number];
  deliveryId?: string;
};

type Tab = 'all' | 'pending' | 'accepted' | 'preparing' | 'ready';
const TABS: { id: Tab; label: string }[] = [
  { id: 'all',      label: 'Barchasi'       },
  { id: 'pending',  label: 'Kutilmoqda'     },
  { id: 'accepted', label: 'Qabul qilindi'  },
  { id: 'preparing',label: 'Tayyorlanmoqda' },
  { id: 'ready',    label: 'Tayyor'         },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING:          'Kutilmoqda',
  ACCEPTED:         'Qabul qilindi',
  PREPARING:        'Tayyorlanmoqda',
  READY_FOR_PICKUP: 'Kuryer kutilmoqda',
  COURIER_ACCEPTED: 'Kuryer kelmoqda',
  PICKED_UP:        'Olib ketildi',
  ON_THE_WAY:       "Yo'lda",
  DELIVERED:        'Yetkazildi',
  CANCELED:         'Bekor qilindi',
};

const STATUS_NEXT: Record<string, { label: string; next: string; color: string }> = {
  PENDING:   { label: 'Qabul qilish',     next: 'ACCEPTED',         color: 'success' },
  ACCEPTED:  { label: 'Tayyorlashni boshlash', next: 'PREPARING',   color: ''        },
  PREPARING: { label: 'Tayyor (kuryer kutish)', next: 'READY_FOR_PICKUP', color: 'warning' },
};

const VEHICLE_LABELS: Record<string, { label: string; icon: string }> = {
  BIKE:  { label: 'Velosiped / Skuter', icon: '🛵' },
  CAR:   { label: 'Avtomobil',          icon: '🚗' },
  VAN:   { label: 'Mikroavtobus',       icon: '🚐' },
  TRUCK: { label: 'Yuk mashinasi',      icon: '🚛' },
};

const TRACKABLE = new Set(['READY_FOR_PICKUP', 'COURIER_ACCEPTED', 'PICKED_UP', 'ON_THE_WAY']);

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [courierSearchOrder, setCourierSearchOrder] = useState<Order | null>(null);
  const [availableCouriers, setAvailableCouriers] = useState<AvailableCourier[]>([]);
  const [searchingCouriers, setSearchingCouriers] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';

  const loadOrders = useCallback(async () => {
    try {
      const res = await api<Order[] | { items?: Order[] }>('/orders/seller', { token });
      const list = Array.isArray(res) ? res : (res.items ?? []);
      setOrders(list);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { router.replace('/login'); return; }
    loadOrders();

    let socket: Socket | null = null;
    let cancelled = false;

    api<{ id: string }>('/seller/profile', { token })
      .then((profile) => {
        if (cancelled || !profile?.id) return;
        socket = io(`${process.env.NEXT_PUBLIC_WS_URL || 'https://ibrohimjon-bmi-production.up.railway.app'}/realtime`, {
          auth: { token }, transports: ['websocket'], reconnectionDelay: 2000,
        });
        socket.on('connect', () => socket?.emit('seller:join', { sellerId: profile.id }));
        socket.on('order:status', (d: { orderId: string; status: string }) => {
          setOrders((prev) => prev.map((o) => o.id === d.orderId ? { ...o, status: d.status } : o));
        });
        socket.on('order:update', (d: { orderId: string; status: string }) => {
          setOrders((prev) => prev.map((o) => o.id === d.orderId ? { ...o, status: d.status } : o));
        });
        socket.on('order:new', () => loadOrders());
      })
      .catch(() => {});

    return () => { cancelled = true; socket?.disconnect(); };
  }, [router, loadOrders, token]);

  const handleAction = async (order: Order, nextStatus: string) => {
    if (!nextStatus) return;
    setLoadingId(order.id);
    try {
      await api(`/orders/${order.id}/seller-status`, { method: 'PATCH', body: { status: nextStatus }, token });
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: nextStatus } : o));
    } catch (e) { alert((e as Error).message); }
    finally { setLoadingId(null); }
  };

  const handleReject = async (order: Order) => {
    if (!confirm("Buyurtmani bekor qilasizmi?")) return;
    setLoadingId(order.id);
    try {
      await api(`/orders/${order.id}/seller-status`, { method: 'PATCH', body: { status: 'CANCELED' }, token });
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    } catch (e) { alert((e as Error).message); }
    finally { setLoadingId(null); }
  };

  const handleCallCourier = async (order: Order) => {
    setCallingId(order.id);
    try {
      await api(`/orders/${order.id}/call-courier`, { method: 'POST', token });
    } catch (e) { alert((e as Error).message); }
    finally { setCallingId(null); }
  };

  const openCourierSearch = async (order: Order) => {
    setCourierSearchOrder(order);
    setSearchingCouriers(true);
    setAvailableCouriers([]);
    try {
      const vt = order.requiredVehicle ?? 'BIKE';
      const list = await api<AvailableCourier[]>(`/courier/search?vehicleType=${vt}`, { token });
      setAvailableCouriers(list);
    } catch { setAvailableCouriers([]); }
    finally { setSearchingCouriers(false); }
  };

  const filtered = orders.filter((o) => {
    if (tab === 'all')      return !['DELIVERED', 'CANCELED', 'FAILED'].includes(o.status);
    if (tab === 'pending')  return o.status === 'PENDING';
    if (tab === 'accepted') return o.status === 'ACCEPTED';
    if (tab === 'preparing')return o.status === 'PREPARING';
    if (tab === 'ready')    return o.status === 'READY_FOR_PICKUP';
    return true;
  });

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  return (
    <div className="app-shell">
      <SellerSidebar pendingCount={pendingCount} />
      <div className="app-main">
        <SellerTopbar title="Buyurtmalar" subtitle={`${filtered.length} ta faol`} />
        <main className="app-content fade-in">
          <div className="stack">
            <div className="tabs">
              {TABS.map((t) => (
                <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                  {t.label}
                  {t.id === 'pending' && pendingCount > 0 && (
                    <span style={{
                      marginLeft: 6, background: 'var(--text)', color: 'var(--surface)',
                      borderRadius: 999, padding: '1px 6px', fontSize: 11, fontWeight: 700,
                    }}>{pendingCount}</span>
                  )}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="empty">
                <div className="empty-ico">🛒</div>
                <strong>Buyurtmalar yo'q</strong>
                <p>Mijozlar buyurtma berganida bu yerda ko'rinadi</p>
              </div>
            ) : (
              <div className="grid-2">
                {filtered.map((order) => {
                  const action = STATUS_NEXT[order.status];
                  const isLoading = loadingId === order.id;
                  const isCalling = callingId === order.id;
                  const vehicle = VEHICLE_LABELS[order.requiredVehicle ?? 'BIKE'];
                  const itemsText = order.items.slice(0, 2)
                    .map((i) => `${i.titleSnapshot} ×${i.quantity}`).join(', ')
                    + (order.items.length > 2 ? ` +${order.items.length - 2} ta` : '');

                  return (
                    <div key={order.id} className={`order-card ${order.status.toLowerCase()}`}>
                      {/* Header */}
                      <div className="hstack" style={{ justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: 15 }}>#{order.code?.slice(0, 8).toUpperCase()}</strong>
                        <span className="chip chip-gray" style={{ fontSize: 11 }}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </div>

                      {/* Customer */}
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{order.customerName}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{order.deliveryAddressText}</div>
                      </div>

                      {/* Items */}
                      <div style={{
                        background: 'var(--surface-2)', borderRadius: 8, padding: '8px 12px',
                        fontSize: 12, color: 'var(--text-secondary)',
                      }}>{itemsText}</div>

                      {/* Amount + time */}
                      <div className="hstack" style={{ justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{money(order.totalAmount)} so'm</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(order.createdAt)}</span>
                      </div>

                      {/* Vehicle type badge */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 10px', borderRadius: 8,
                        background: 'var(--surface-2)', fontSize: 12,
                        border: '1px solid var(--border)',
                      }}>
                        <span>{vehicle.icon}</span>
                        <span style={{ color: 'var(--text-muted)' }}>Kerakli transport:</span>
                        <strong>{vehicle.label}</strong>
                      </div>

                      {/* Action buttons */}
                      {action && (
                        <div className="hstack" style={{ gap: 8 }}>
                          {order.status === 'PENDING' && (
                            <button
                              className="btn danger sm"
                              onClick={() => handleReject(order)}
                              disabled={isLoading}
                              style={{ flex: 1 }}
                            >Rad etish</button>
                          )}
                          <button
                            className={`btn ${action.color || 'primary'} sm`}
                            onClick={() => handleAction(order, action.next)}
                            disabled={isLoading}
                            style={{ flex: 2 }}
                          >
                            {isLoading ? 'Yangilanmoqda…' : action.label}
                          </button>
                        </div>
                      )}

                      {/* READY_FOR_PICKUP — call courier + search couriers */}
                      {order.status === 'READY_FOR_PICKUP' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <button
                            className="btn primary sm"
                            style={{ width: '100%' }}
                            onClick={() => handleCallCourier(order)}
                            disabled={isCalling}
                          >
                            {isCalling ? 'Kuryer qidirilmoqda…' : `${vehicle.label} kuryer chaqirish`}
                          </button>
                          <button
                            className="btn ghost sm"
                            style={{ width: '100%' }}
                            onClick={() => openCourierSearch(order)}
                          >
                            Mavjud kuryerlarni ko&apos;rish
                          </button>
                        </div>
                      )}

                      {/* Courier on the way — track button */}
                      {TRACKABLE.has(order.status) && order.sellerPos && order.customerPos && (
                        <button
                          className="btn ghost sm"
                          onClick={() => setTrackingOrder(order)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: 8,
                            border: '1px solid var(--primary-100)',
                            background: 'var(--primary-50)',
                            color: 'var(--primary-600)', fontWeight: 600,
                          }}
                        >
                          🛵 Kurerni xaritada kuzatish
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {trackingOrder && trackingOrder.sellerPos && trackingOrder.customerPos && (
        <SellerDeliveryTracker
          open={!!trackingOrder}
          onClose={() => setTrackingOrder(null)}
          orderCode={trackingOrder.code}
          customerName={trackingOrder.customerName}
          deliveryId={trackingOrder.deliveryId ?? trackingOrder.id}
          sellerPos={trackingOrder.sellerPos}
          customerPos={trackingOrder.customerPos}
        />
      )}

      {/* Courier search modal */}
      {courierSearchOrder && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: 'rgba(0,0,0,0.45)', display: 'flex',
          alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={() => setCourierSearchOrder(null)}>
          <div style={{
            background: 'var(--surface)', borderRadius: '20px 20px 0 0',
            width: '100%', maxWidth: 540, padding: '24px 20px 32px',
            maxHeight: '80vh', overflowY: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>Mavjud kuryerlar</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {VEHICLE_LABELS[courierSearchOrder.requiredVehicle ?? 'BIKE']?.label} va undan yuqori
                </div>
              </div>
              <button
                onClick={() => setCourierSearchOrder(null)}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }}
              >✕</button>
            </div>

            {searchingCouriers ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>Qidirilmoqda…</div>
            ) : availableCouriers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Hozirda mos kuryer mavjud emas</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Kuryer chaqirish tugmasini bosing — ular bildirishnoma oladi</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {availableCouriers.map((c) => (
                  <div key={c.id} style={{
                    background: 'var(--surface-2)', borderRadius: 12,
                    padding: '12px 14px', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{c.user?.fullName ?? 'Kuryer'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {VEHICLE_LABELS[c.vehicleType]?.label ?? c.vehicleType}
                        {c.vehicleModel ? ` — ${c.vehicleModel}` : ''}
                        {c.vehiclePlate ? ` (${c.vehiclePlate})` : ''}
                      </div>
                    </div>
                    <div style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '4px 10px',
                      fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                    }}>Online</div>
                  </div>
                ))}
                <button
                  className="btn primary sm"
                  style={{ marginTop: 8 }}
                  onClick={() => { handleCallCourier(courierSearchOrder); setCourierSearchOrder(null); }}
                  disabled={callingId === courierSearchOrder.id}
                >
                  Barchaga bildirishnoma yuborish
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
