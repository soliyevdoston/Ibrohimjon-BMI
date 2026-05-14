'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BottomNav } from '@/components/BottomNav';
import { api, money } from '@/lib/api';
import { useCartStore } from '@/stores/cart';

type FavProduct = {
  id: string;
  title: string;
  price: number | string;
  originalPrice?: number | string | null;
  stock: number;
  imageUrl?: string | null;
  sellerId: string;
  seller?: { id: string; brandName: string; rating: number };
  weightKg?: number | string;
  requiresVehicle?: 'BIKE' | 'CAR' | 'VAN' | 'TRUCK';
};

type FavRow = {
  id: string;
  productId: string;
  createdAt: string;
  product: FavProduct;
};

export default function FavoritesPage() {
  const router = useRouter();
  const add = useCartStore((s) => s.add);
  const [items, setItems] = useState<FavRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<FavRow[]>('/favorites');
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { router.replace('/login?redirect=/favorites'); return; }
    load();
  }, [router, load]);

  const remove = async (productId: string) => {
    try {
      await api(`/favorites/${productId}/toggle`, { method: 'POST' });
      setItems((prev) => prev.filter((r) => r.productId !== productId));
    } catch {/* ignore */}
  };

  const addToCart = (p: FavProduct) => {
    const numericPrice = typeof p.price === 'string' ? Number(p.price) : p.price;
    add({
      productId: p.id,
      title: p.title,
      price: numericPrice,
      quantity: 1,
      sellerId: p.sellerId,
      imageUrl: p.imageUrl ?? undefined,
      weightKg: p.weightKg ? Number(p.weightKg) : 1,
      requiresVehicle: p.requiresVehicle ?? 'BIKE',
    });
  };

  return (
    <div className="page" style={{ paddingBottom: 88 }}>
      <div style={{ padding: '32px 20px 16px', paddingTop: 'max(32px, calc(env(safe-area-inset-top) + 16px))' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>
          Sevimli mahsulotlar
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          {loading ? 'Yuklanmoqda…' : items.length === 0 ? '' : `${items.length} ta mahsulot`}
        </p>
      </div>

      {items.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{
            display: 'inline-flex', padding: 18, borderRadius: 16,
            border: '1px solid var(--border)', marginBottom: 12, fontSize: 28,
          }}>🤍</div>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
            Sevimli ro&apos;yxati bo&apos;sh
          </div>
          <div style={{ fontSize: 13, marginTop: 6 }}>
            Mahsulotlar ustidagi yurakcha tugmasi ularni shu yerga qo&apos;shadi.
          </div>
        </div>
      )}

      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {items.map((row) => {
            const p = row.product;
            const numericPrice = typeof p.price === 'string' ? Number(p.price) : p.price;
            const orig = p.originalPrice != null ? Number(p.originalPrice) : null;
            const outOfStock = p.stock <= 0;
            return (
              <div
                key={row.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                <button
                  onClick={() => remove(p.id)}
                  style={{
                    position: 'absolute', top: 8, right: 8, zIndex: 2,
                    width: 32, height: 32, borderRadius: 999,
                    background: 'rgba(255,255,255,0.95)', border: 'none',
                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    display: 'grid', placeItems: 'center', fontSize: 16,
                  }}
                  aria-label="Sevimlilardan olib tashlash"
                >❤️</button>

                <div
                  style={{ aspectRatio: '1', background: '#f1f5f9', position: 'relative', cursor: 'pointer' }}
                  onClick={() => router.push(`/products/${p.id}`)}
                >
                  {p.imageUrl ? (
                    <Image src={p.imageUrl} alt={p.title} fill style={{ objectFit: 'cover' }} unoptimized />
                  ) : (
                    <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--text-muted)' }}>—</div>
                  )}
                </div>

                <div style={{ padding: 10, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13, fontWeight: 600, color: 'var(--text)',
                      lineHeight: 1.3, marginBottom: 4, cursor: 'pointer',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    onClick={() => router.push(`/products/${p.id}`)}
                  >
                    {p.title}
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
                      {money(numericPrice)} so&apos;m
                    </div>
                    {orig && orig > numericPrice && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        {money(orig)}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(p)}
                    disabled={outOfStock}
                    className="btn"
                    style={{ marginTop: 8, fontSize: 12, padding: '8px 0', opacity: outOfStock ? 0.5 : 1 }}
                  >
                    {outOfStock ? 'Tugagan' : 'Savatga'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
