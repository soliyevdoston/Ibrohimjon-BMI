'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { MapPreview } from '@/components/MapPreview';
import { money } from '@/lib/api';
import { useCartStore } from '@/stores/cart-store';

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCartStore();
  const subtotalAmount = subtotal();
  const deliveryFee = useMemo(() => Math.round(6000 + items.length * 1400), [items.length]);
  const total = subtotalAmount + deliveryFee;

  const [address, setAddress] = useState('Tashkent, Yunusobod district');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('card');
  const [confirmed, setConfirmed] = useState(false);

  if (!items.length) {
    return (
      <section className="empty fade-in">
        <strong>Your cart is empty</strong>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Add products before checkout.</p>
        <Link href="/customer" className="btn">
          Back to catalog
        </Link>
      </section>
    );
  }

  return (
    <section className="grid-2 fade-in">
      <article className="card stack">
        <h2 style={{ margin: 0 }}>Checkout</h2>

        <div className="stack">
          <div>
            <strong>1. Select location</strong>
            <MapPreview marker={{ x: 54, y: 49 }} />
          </div>

          <div>
            <strong>2. Confirm address</strong>
            <input className="input" value={address} onChange={(event) => setAddress(event.target.value)} />
          </div>

          <div>
            <strong>3. Choose payment</strong>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                className={`btn ${paymentMethod === 'card' ? '' : 'secondary'}`}
                onClick={() => setPaymentMethod('card')}
              >
                Card
              </button>
              <button
                className={`btn ${paymentMethod === 'cash' ? '' : 'secondary'}`}
                onClick={() => setPaymentMethod('cash')}
              >
                Cash
              </button>
            </div>
          </div>

          <button
            className="btn"
            onClick={() => {
              setConfirmed(true);
              clear();
            }}
          >
            4. Confirm order
          </button>

          {confirmed ? (
            <p style={{ margin: 0, color: 'var(--success)', fontWeight: 700 }}>Order confirmed successfully.</p>
          ) : null}
        </div>
      </article>

      <aside className="card stack">
        <h3 style={{ margin: 0 }}>Price breakdown</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Products</span>
            <strong>{money(subtotalAmount)} so'm</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Delivery fee</span>
            <strong>{money(deliveryFee)} so'm</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20 }}>
            <span>Total</span>
            <strong>{money(total)} so'm</strong>
          </div>
        </div>
      </aside>
    </section>
  );
}
