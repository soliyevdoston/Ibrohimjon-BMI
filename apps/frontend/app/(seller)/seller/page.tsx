'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/Skeleton';
import { api, money } from '@/lib/api';

type Dashboard = {
  todayOrders: number;
  activeOrders: number;
  todayRevenue: number;
};

export default function SellerDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    api<Dashboard>('/orders/seller/dashboard')
      .then(setData)
      .catch(() =>
        setData({
          todayOrders: 0,
          activeOrders: 0,
          todayRevenue: 0,
        }),
      );
  }, []);

  return (
    <section className="stack fade-in">
      <h2 style={{ margin: 0 }}>Seller dashboard</h2>
      {!data ? (
        <div className="grid-3">
          <Skeleton height={110} />
          <Skeleton height={110} />
          <Skeleton height={110} />
        </div>
      ) : (
        <div className="grid-3">
          <article className="card">
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Today orders</p>
            <strong style={{ fontSize: 28 }}>{data.todayOrders}</strong>
          </article>
          <article className="card">
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Active orders</p>
            <strong style={{ fontSize: 28 }}>{data.activeOrders}</strong>
          </article>
          <article className="card">
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Today revenue</p>
            <strong style={{ fontSize: 28 }}>{money(data.todayRevenue)} so'm</strong>
          </article>
        </div>
      )}
    </section>
  );
}
