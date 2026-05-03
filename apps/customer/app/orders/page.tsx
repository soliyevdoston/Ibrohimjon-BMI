'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, money } from '@/lib/api';
import { BottomNav } from '@/components/BottomNav';

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

type Order = {
  id: string;
  code?: string;
  status: OrderStatus;
  createdAt: string;
  total?: number;
  totalAmount?: number;
  items?: Array<{ id: string; quantity: number }>;
  itemsCount?: number;
  deliveryAddress?: string;
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlandi',
  preparing: 'Tayyorlanmoqda',
  picked_up: 'Kuryer oldi',
  on_the_way: 'Yo\'lda',
  delivered: 'Yetkazildi',
  cancelled: 'Bekor qilindi',
};

const STATUS_CHIP: Record<OrderStatus, string> = {
  pending: 'chip chip-gray',
  confirmed: 'chip chip-gray',
  preparing: 'chip chip-gray',
  picked_up: 'chip chip-gray',
  on_the_way: 'chip chip-gray',
  delivered: 'chip chip-gray',
  cancelled: 'chip chip-gray',
};

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('uz-UZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}


export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.replace('/login'); return; }

    type RawOrder = {
      id: string;
      code?: string;
      status: string;
      createdAt: string;
      total?: number | string;
      totalAmount?: number | string;
      items?: Array<{ id: string; quantity: number }>;
      itemsCount?: number;
      deliveryAddress?: string;
      deliveryAddressText?: string;
    };

    const normalize = (raw: RawOrder): Order => ({
      id: raw.id,
      code: raw.code ?? `#${raw.id.slice(0, 8).toUpperCase()}`,
      status: (raw.status ?? 'pending').toLowerCase() as OrderStatus,
      createdAt: raw.createdAt,
      total: typeof raw.totalAmount === 'string' ? Number(raw.totalAmount)
            : typeof raw.totalAmount === 'number' ? raw.totalAmount
            : typeof raw.total === 'string' ? Number(raw.total)
            : (raw.total ?? 0),
      items: raw.items,
      itemsCount: raw.itemsCount ?? raw.items?.reduce((a, i) => a + i.quantity, 0),
      deliveryAddress: raw.deliveryAddress ?? raw.deliveryAddressText,
    });

    const load = async () => {
      try {
        const data = await api<RawOrder[] | { data?: RawOrder[]; items?: RawOrder[] }>('/orders/my', { token });
        const list = Array.isArray(data)
          ? data
          : (data as { data?: RawOrder[]; items?: RawOrder[] }).items
            ?? (data as { data?: RawOrder[]; items?: RawOrder[] }).data
            ?? [];
        setOrders(list.map(normalize));
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const isActive = (status: OrderStatus) =>
    ['pending', 'confirmed', 'preparing', 'picked_up', 'on_the_way'].includes(status);

  return (
    <div className="page">
      {/* Header */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '20px 16px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Buyurtmalarim</h1>
      </div>

      <div style={{ padding: '16px', maxWidth: 680, margin: '0 auto' }}>
        {loading ? (
          <div className="stack">
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ background: 'var(--surface)', borderRadius: 16, padding: 16, border: '1px solid var(--border)' }}>
                <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: 10 }} />
                <div className="skeleton skeleton-text" style={{ width: '70%', marginBottom: 8 }} />
                <div className="skeleton skeleton-text" style={{ width: '50%' }} />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">Buyurtmalar yo&apos;q</div>
            <div className="empty-state-desc">
              Hali birorta buyurtma bermadingiz
            </div>
            <Link href="/home">
              <button className="btn" style={{ marginTop: 8 }}>
                Xarid qilish
              </button>
            </Link>
          </div>
        ) : (
          <div className="stack">
            {/* Active orders section */}
            {orders.filter((o) => isActive(o.status)).length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Faol buyurtmalar
                </div>
                {orders
                  .filter((o) => isActive(o.status))
                  .map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
              </>
            )}

            {/* Past orders section */}
            {orders.filter((o) => !isActive(o.status)).length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>
                  O&apos;tgan buyurtmalar
                </div>
                {orders
                  .filter((o) => !isActive(o.status))
                  .map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
              </>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const router = useRouter();
  const itemsCount =
    order.itemsCount ??
    (order.items ? order.items.reduce((a, i) => a + i.quantity, 0) : 0);
  const total = order.total ?? order.totalAmount ?? 0;

  return (
    <div
      className="order-card"
      onClick={() => router.push(`/orders/${order.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/orders/${order.id}`)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>
          {order.code ?? `#${order.id.slice(0, 8).toUpperCase()}`}
        </div>
        <span className={STATUS_CHIP[order.status]}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>🕐</span>
          {formatDate(order.createdAt)}
        </div>
        {order.deliveryAddress && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
            <span style={{ flexShrink: 0 }}>📍</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {order.deliveryAddress}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {itemsCount > 0 ? `${itemsCount} ta mahsulot` : ''}
        </div>
        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>
          {total > 0 ? `${money(total)} so'm` : ''}
        </div>
      </div>

      {/* Track button for active orders */}
      {['on_the_way', 'picked_up'].includes(order.status) && (
        <div style={{
          background: 'var(--surface-alt)',
          borderRadius: 10,
          border: '1px solid var(--border)',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          color: 'var(--text)',
          fontWeight: 600,
        }}>
          Kuryer yo&apos;lda — kuzatish
        </div>
      )}
    </div>
  );
}
