'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SellerSidebar } from '@/components/Sidebar';
import { SellerTopbar } from '@/components/Topbar';
import { api, money, timeAgo } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

type OrderItem = { id: string; titleSnapshot: string; quantity: number; priceSnapshot: number };
type Order = {
  id: string; code: string; status: string;
  customerName: string; totalAmount: number; createdAt: string;
  items: OrderItem[]; deliveryAddressText: string;
};

type Tab = 'all' | 'pending' | 'accepted' | 'preparing' | 'ready';
const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'ready', label: 'Ready' },
];

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'gray', ACCEPTED: 'gray', PREPARING: 'gray',
  READY_FOR_PICKUP: 'gray', DELIVERED: 'gray', CANCELED: 'gray', FAILED: 'gray',
};

const DEMO_ORDERS: Order[] = [
  {
    id: '1', code: 'ORD-128', status: 'PENDING',
    customerName: 'Dilnoza Karimova', totalAmount: 185000,
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
    deliveryAddressText: 'Yunusobod district, Toshkent',
    items: [
      { id: 'i1', titleSnapshot: 'Fresh Tomatoes', quantity: 3, priceSnapshot: 18000 },
      { id: 'i2', titleSnapshot: 'Uzbek Bread', quantity: 2, priceSnapshot: 8000 },
      { id: 'i3', titleSnapshot: 'Green Tea 100g', quantity: 3, priceSnapshot: 35000 },
    ],
  },
  {
    id: '2', code: 'ORD-127', status: 'ACCEPTED',
    customerName: 'Jamshid Toshmatov', totalAmount: 340000,
    createdAt: new Date(Date.now() - 18 * 60000).toISOString(),
    deliveryAddressText: 'Mirzo Ulugbek, Toshkent',
    items: [
      { id: 'i3', titleSnapshot: 'Olive Oil 500ml', quantity: 2, priceSnapshot: 89000 },
      { id: 'i4', titleSnapshot: 'Pomegranate Juice 1L', quantity: 3, priceSnapshot: 45000 },
    ],
  },
  {
    id: '3', code: 'ORD-126', status: 'PREPARING',
    customerName: 'Zulfiya Mirzayeva', totalAmount: 95000,
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
    deliveryAddressText: 'Chilonzor, Toshkent',
    items: [{ id: 'i5', titleSnapshot: 'Fresh Tomatoes', quantity: 5, priceSnapshot: 18000 }],
  },
  {
    id: '4', code: 'ORD-125', status: 'READY_FOR_PICKUP',
    customerName: 'Bobur Nazarov', totalAmount: 220000,
    createdAt: new Date(Date.now() - 55 * 60000).toISOString(),
    deliveryAddressText: 'Shayxontohur, Toshkent',
    items: [
      { id: 'i6', titleSnapshot: 'Green Tea 100g', quantity: 2, priceSnapshot: 35000 },
      { id: 'i7', titleSnapshot: 'Uzbek Bread', quantity: 5, priceSnapshot: 8000 },
    ],
  },
];

const STATUS_NEXT: Record<string, { label: string; next: string; color: string }> = {
  PENDING:         { label: 'Accept Order', next: 'ACCEPTED', color: 'success' },
  ACCEPTED:        { label: 'Start Preparing', next: 'PREPARING', color: '' },
  PREPARING:       { label: 'Ready for Pickup', next: 'READY_FOR_PICKUP', color: 'warning' },
  READY_FOR_PICKUP: { label: 'Waiting for courier…', next: '', color: '' },
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(DEMO_ORDERS);
  const [tab, setTab] = useState<Tab>('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';

  const loadOrders = useCallback(async () => {
    try {
      const res = await api<{ items: Order[] }>('/sellers/orders', { token });
      setOrders(res.items);
    } catch { /* use demo */ }
  }, [token]);

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { router.replace('/login'); return; }
    loadOrders();

    const socket: Socket = io(`${process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000'}/realtime`, {
      auth: { token }, transports: ['websocket'], reconnectionDelay: 2000,
    });
    socket.on('connect', () => {
      socket.emit('seller:join', { token });
    });
    socket.on('order:status', (data: { orderId: string; status: string }) => {
      setOrders((prev) => prev.map((o) => o.id === data.orderId ? { ...o, status: data.status } : o));
    });
    socket.on('order:new', (order: Order) => {
      setOrders((prev) => [order, ...prev]);
    });
    return () => { socket.disconnect(); };
  }, [router, loadOrders]);

  const handleAction = async (order: Order, nextStatus: string) => {
    if (!nextStatus) return;
    setLoadingId(order.id);
    try {
      await api(`/orders/${order.id}/status`, { method: 'PATCH', body: { status: nextStatus }, token });
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: nextStatus } : o));
    } catch (e) { alert((e as Error).message); }
    finally { setLoadingId(null); }
  };

  const handleReject = async (order: Order) => {
    if (!confirm('Reject and cancel this order?')) return;
    setLoadingId(order.id);
    try {
      await api(`/orders/${order.id}/status`, { method: 'PATCH', body: { status: 'CANCELED' }, token });
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    } catch (e) { alert((e as Error).message); }
    finally { setLoadingId(null); }
  };

  const filtered = orders.filter((o) => {
    if (tab === 'all') return !['DELIVERED', 'CANCELED', 'FAILED'].includes(o.status);
    if (tab === 'pending') return o.status === 'PENDING';
    if (tab === 'accepted') return o.status === 'ACCEPTED';
    if (tab === 'preparing') return o.status === 'PREPARING';
    if (tab === 'ready') return o.status === 'READY_FOR_PICKUP';
    return true;
  });

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  return (
    <div className="app-shell">
      <SellerSidebar pendingCount={pendingCount} />
      <div className="app-main">
        <SellerTopbar title="Orders" subtitle={`${filtered.length} active`} />
        <main className="app-content fade-in">
          <div className="stack">
            {/* Tabs */}
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
                <strong>No orders here</strong>
                <p>Orders will appear as customers place them</p>
              </div>
            ) : (
              <div className="grid-2">
                {filtered.map((order) => {
                  const action = STATUS_NEXT[order.status];
                  const isLoading = loadingId === order.id;
                  const itemsText = order.items.slice(0, 2).map((i) => `${i.titleSnapshot} ×${i.quantity}`).join(', ')
                    + (order.items.length > 2 ? ` +${order.items.length - 2} more` : '');

                  return (
                    <div key={order.id} className={`order-card ${order.status.toLowerCase()}`}>
                      <div className="hstack" style={{ justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: 15 }}>{order.code}</strong>
                        <span className={`chip ${STATUS_COLOR[order.status] ?? 'gray'}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{order.customerName}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{order.deliveryAddressText}</div>
                      </div>

                      <div style={{
                        background: 'var(--surface-2)', borderRadius: 8, padding: '8px 12px',
                        fontSize: 12, color: 'var(--text-secondary)',
                      }}>
                        {itemsText}
                      </div>

                      <div className="hstack" style={{ justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{money(order.totalAmount)} so'm</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(order.createdAt)}</span>
                      </div>

                      {action && (
                        <div className="hstack" style={{ gap: 8 }}>
                          {order.status === 'PENDING' && (
                            <button
                              className="btn danger sm"
                              onClick={() => handleReject(order)}
                              disabled={isLoading}
                              style={{ flex: 1 }}
                            >
                              Reject
                            </button>
                          )}
                          {action.next ? (
                            <button
                              className={`btn ${action.color} sm`}
                              onClick={() => handleAction(order, action.next)}
                              disabled={isLoading}
                              style={{ flex: 2 }}
                            >
                              {isLoading ? 'Updating…' : action.label}
                            </button>
                          ) : (
                            <div style={{
                              flex: 1, textAlign: 'center', padding: '7px 10px',
                              background: 'var(--surface-2)', borderRadius: 8,
                              border: '1px solid var(--border)',
                              fontSize: 12, color: 'var(--text-muted)', fontWeight: 600,
                            }}>
                              {action.label}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
