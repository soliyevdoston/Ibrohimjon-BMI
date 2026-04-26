'use client';
import { useCartStore } from '@/stores/cart';
import { money } from '@/lib/api';
import { useRouter } from 'next/navigation';

const DELIVERY_FEE = 8000;

export function CartDrawer() {
  const { items, isOpen, toggleCart, updateQty, remove, subtotal } = useCartStore();
  const router = useRouter();

  if (!isOpen) return null;

  const total = subtotal() + DELIVERY_FEE;

  const handleCheckout = () => {
    toggleCart();
    router.push('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="cart-drawer-backdrop"
        onClick={toggleCart}
        role="presentation"
      />

      {/* Drawer panel */}
      <div className="cart-drawer" role="dialog" aria-label="Savat">
        <div className="cart-drawer-handle" />

        {/* Header */}
        <div className="cart-drawer-header">
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>
            Savat {items.length > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 15 }}>({items.length})</span>}
          </h3>
          <button
            onClick={toggleCart}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '2px solid var(--border)',
              background: 'var(--surface-alt)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: 'var(--text-secondary)',
            }}
            aria-label="Yopish"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon">🛒</div>
              <div className="empty-state-title">Savat bo&apos;sh</div>
              <div className="empty-state-desc">
                Mahsulot qo&apos;shish uchun katalogga qayting
              </div>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="cart-item">
                {/* Image / Emoji placeholder */}
                <div
                  className="cart-item-image"
                  style={{ background: 'var(--primary-light)', borderRadius: 12 }}
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
                    />
                  ) : (
                    '📦'
                  )}
                </div>

                {/* Info */}
                <div className="cart-item-info">
                  <div className="cart-item-title">{item.title}</div>
                  <div className="cart-item-price">{money(item.price)} so&apos;m</div>
                </div>

                {/* Qty controls */}
                <div className="qty-control">
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.productId, item.quantity - 1)}
                    aria-label="Kamaytirish"
                  >
                    −
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.productId, item.quantity + 1)}
                    aria-label="Ko'paytirish"
                  >
                    +
                  </button>
                </div>

                {/* Remove */}
                <button
                  onClick={() => remove(item.productId)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    fontSize: 20,
                    lineHeight: 1,
                    padding: '0 4px',
                  }}
                  aria-label="O'chirish"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="cart-drawer-footer">
            {/* Price breakdown */}
            <div style={{ background: 'var(--surface-alt)', borderRadius: 12, padding: '12px 16px' }}>
              <div className="price-row">
                <span className="price-row-label">Mahsulotlar</span>
                <span className="price-row-value">{money(subtotal())} so&apos;m</span>
              </div>
              <div className="price-row">
                <span className="price-row-label">Yetkazib berish</span>
                <span className="price-row-value">{money(DELIVERY_FEE)} so&apos;m</span>
              </div>
              <div className="price-row total">
                <span className="price-row-label" style={{ fontWeight: 700, color: 'var(--text)' }}>Jami</span>
                <span className="price-row-value">{money(total)} so&apos;m</span>
              </div>
            </div>

            <button
              className="btn btn-full"
              style={{ height: 52, fontSize: 16 }}
              onClick={handleCheckout}
            >
              Buyurtma berish →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
