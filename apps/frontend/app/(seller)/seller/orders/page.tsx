'use client';

import { useState } from 'react';

const nextStatus = {
  PENDING: 'ACCEPTED',
  ACCEPTED: 'PREPARING',
  PREPARING: 'READY_FOR_PICKUP',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
} as const;

type SellerStatus = keyof typeof nextStatus;

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState([
    { id: 'ord-1', customer: '998901112233', total: 130000, status: 'PENDING' as SellerStatus },
    { id: 'ord-2', customer: '998901119900', total: 54000, status: 'PREPARING' as SellerStatus },
  ]);

  return (
    <section className="stack fade-in">
      <h2 style={{ margin: 0 }}>Order queue</h2>
      {orders.map((order) => (
        <article key={order.id} className="card" style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>{order.id}</strong>
            <span className="badge">{order.status}</span>
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>Customer: {order.customer}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Total: {order.total.toLocaleString()} so'm</div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn"
              onClick={() =>
                setOrders((current) =>
                  current.map((item) =>
                    item.id === order.id ? { ...item, status: nextStatus[item.status] } : item,
                  ),
                )
              }
            >
              Move to {nextStatus[order.status]}
            </button>

            {order.status === 'READY_FOR_PICKUP' ? (
              <button className="btn secondary">Call courier</button>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  );
}
