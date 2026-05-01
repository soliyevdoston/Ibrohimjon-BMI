'use client';
import { useEffect, useState } from 'react';
import { money } from '@/lib/api';
import { useFavoritesStore } from '@/stores/favorites';

export type ModalProduct = {
  id: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  categoryId?: string;
  seller?: { id: string; name: string };
  sellerId?: string;
};

export function ProductDetailModal({
  product,
  open,
  onClose,
  onAdd,
  fallbackEmoji = '📦',
}: {
  product: ModalProduct | null;
  open: boolean;
  onClose: () => void;
  onAdd: (product: ModalProduct, quantity: number) => void;
  fallbackEmoji?: string;
}) {
  const [qty, setQty] = useState(1);
  const [imgError, setImgError] = useState(false);
  const isFavorite = useFavoritesStore((s) => (product ? s.ids.has(product.id) : false));
  const toggleFav = useFavoritesStore((s) => s.toggle);

  useEffect(() => {
    if (open) { setQty(1); setImgError(false); }
  }, [open, product?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || !product) return null;

  const outOfStock = product.stock === 0;
  const total = product.price * qty;
  const maxQty = Math.min(product.stock || 99, 99);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        animation: 'modalFadeIn 200ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface, #fff)',
          borderRadius: 24,
          width: '100%',
          maxWidth: 720,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.35)',
          animation: 'modalSlideUp 280ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 10',
            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {product.imageUrl && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.title}
                onError={() => setImgError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: 96 }}>{fallbackEmoji}</span>
            )}

            <button
              onClick={onClose}
              aria-label="Yopish"
              style={{
                position: 'absolute', top: 14, right: 14,
                width: 40, height: 40, borderRadius: '50%',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#0f172a',
                fontSize: 18, fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
                backdropFilter: 'blur(4px)',
              }}
            >✕</button>

            <button
              onClick={() => toggleFav(product.id)}
              aria-label={isFavorite ? "Sevimlilardan o'chirish" : 'Sevimlilarga qo\'shish'}
              style={{
                position: 'absolute', top: 14, left: 14,
                width: 40, height: 40, borderRadius: '50%',
                border: 'none',
                background: isFavorite ? '#ef4444' : 'rgba(255, 255, 255, 0.95)',
                color: isFavorite ? '#fff' : '#ef4444',
                fontSize: 20,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
                transition: 'transform 200ms ease',
              }}
            >{isFavorite ? '♥' : '♡'}</button>

            {outOfStock && (
              <div style={{
                position: 'absolute', bottom: 14, left: 14,
                padding: '6px 14px',
                background: 'rgba(15, 23, 42, 0.85)',
                color: '#fff',
                borderRadius: 999,
                fontSize: 11, fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}>Tugagan</div>
            )}
          </div>

          <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
            {product.seller?.name && (
              <div style={{
                display: 'inline-block',
                fontSize: 11, fontWeight: 700,
                color: '#4338ca',
                background: '#eef2ff',
                padding: '4px 10px',
                borderRadius: 999,
                marginBottom: 10,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}>{product.seller.name}</div>
            )}

            <h2 style={{
              fontSize: 24, fontWeight: 800,
              color: 'var(--text)',
              marginBottom: 8,
              letterSpacing: '-0.5px',
              lineHeight: 1.2,
            }}>{product.title}</h2>

            {product.description && (
              <p style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: 18,
              }}>{product.description}</p>
            )}

            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              marginBottom: 18,
              fontSize: 12, color: 'var(--text-muted)',
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: '#10b981' }}>●</span>
                <span>Zaxirada {product.stock} ta</span>
              </span>
              <span>•</span>
              <span>30 daqiqada yetkaziladi</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 18px',
              background: 'var(--surface-2, #f9fafb)',
              borderRadius: 14,
              border: '1px solid var(--border, #e5e7eb)',
              marginBottom: 18,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Miqdori
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    border: 'none',
                    background: qty <= 1 ? '#e5e7eb' : '#0f172a',
                    color: '#fff',
                    fontSize: 18, fontWeight: 700,
                    cursor: qty <= 1 ? 'not-allowed' : 'pointer',
                    transition: 'background 150ms ease',
                  }}
                >−</button>
                <span style={{
                  minWidth: 40, textAlign: 'center',
                  fontSize: 18, fontWeight: 800, color: 'var(--text)',
                }}>{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  disabled={qty >= maxQty}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    border: 'none',
                    background: qty >= maxQty ? '#e5e7eb' : '#0f172a',
                    color: '#fff',
                    fontSize: 18, fontWeight: 700,
                    cursor: qty >= maxQty ? 'not-allowed' : 'pointer',
                  }}
                >+</button>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Jami</span>
              <span style={{
                fontSize: 28, fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.5px',
              }}>{money(total)} so&apos;m</span>
            </div>
          </div>
        </div>

        <div style={{
          padding: '14px 28px 22px',
          borderTop: '1px solid var(--border, #e5e7eb)',
          background: 'var(--surface, #fff)',
        }}>
          <button
            disabled={outOfStock}
            onClick={() => { onAdd(product, qty); onClose(); }}
            style={{
              width: '100%',
              height: 54,
              border: 'none',
              borderRadius: 14,
              background: outOfStock
                ? '#e5e7eb'
                : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: '#fff',
              fontSize: 15, fontWeight: 700,
              letterSpacing: 0.3,
              cursor: outOfStock ? 'not-allowed' : 'pointer',
              boxShadow: outOfStock ? 'none' : '0 8px 20px rgba(79, 70, 229, 0.35)',
              transition: 'transform 150ms ease, box-shadow 150ms ease',
            }}
            onMouseEnter={(e) => { if (!outOfStock) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
          >
            {outOfStock ? 'Tugagan' : `Savatga qo\'shish · ${money(total)} so'm`}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
