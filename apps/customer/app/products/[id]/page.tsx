'use client';
import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, money } from '@/lib/api';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import { useFavoritesStore } from '@/stores/favorites';
import { BottomNav } from '@/components/BottomNav';

type Product = {
  id: string;
  title: string;
  description?: string;
  price: number | string;
  stock: number;
  imageUrl?: string;
  categoryId?: string;
  sellerId?: string;
  seller?: { id?: string; name?: string; brandName?: string };
  category?: { id: string; name: string; slug: string };
  weightKg?: number | string;
  dimensionsCm?: string;
  requiresVehicle?: 'BIKE' | 'CAR' | 'VAN' | 'TRUCK';
  isFragile?: boolean;
  isOversized?: boolean;
};

type RawProductsRes = Product[] | { items?: Product[]; data?: Product[] };

const UNS = (id: string) => `https://images.unsplash.com/${id}?w=1200&q=85&auto=format&fit=crop`;

// Per-category extra gallery images (3 per category)
const CATEGORY_GALLERY: Record<string, string[]> = {
  bakery:      ['photo-1565958011703-44f9829ba187', 'photo-1486427944299-d1955d23e34d', 'photo-1571115177098-24ec42ed204d'],
  drinks:      ['photo-1551024709-8f23befc6f87', 'photo-1437418747212-8d9709afab22', 'photo-1497636577773-f1231844b336'],
  sweets:      ['photo-1623660053975-e69c8df0040c', 'photo-1582716401301-b2407dc7563d', 'photo-1582058091505-f87a2e55a40f'],
  pharmacy:    ['photo-1550572017-edd951b55104', 'photo-1626516890025-6b3f24f5bd2b', 'photo-1583912267550-4f6a32ce7e93'],
  electronics: ['photo-1592750475338-74b7b21085ab', 'photo-1517336714731-489689fd1ca8', 'photo-1606220945770-b5b6c2c55bf1'],
  home:        ['photo-1631049307264-da0ec9d70304', 'photo-1565374790459-72c35adb3aab', 'photo-1547074620-f17b3f0bcaa5'],
  beauty:      ['photo-1541643600914-78b084683601', 'photo-1586495777744-4413f21062fa', 'photo-1556228720-195a672e8a03'],
};

function buildGallery(product: Product): string[] {
  const slug = product.category?.slug ?? '';
  const main = product.imageUrl;
  const extras = (CATEGORY_GALLERY[slug] ?? []).map(UNS);
  const all = [main, ...extras].filter((x): x is string => !!x);
  return all.slice(0, 4);
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { add, count, toggleCart, items } = useCartStore();
  const { accessToken, init } = useAuthStore();
  const initFavs = useFavoritesStore((s) => s.init);
  const isFav = useFavoritesStore((s) => s.ids.has(id));
  const toggleFav = useFavoritesStore((s) => s.toggle);

  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const isLoggedIn = !!accessToken;
  const safeCartCount = hydrated ? count() : 0;
  useEffect(() => { init(); initFavs(); setHydrated(true); }, [init, initFavs]);

  // Load main product
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<Product>(`/products/${id}`)
      .then((p) => { if (!cancelled) setProduct(p); })
      .catch(() => { if (!cancelled) setProduct(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  // Load similar products
  useEffect(() => {
    if (!product?.categoryId) return;
    let cancelled = false;
    api<RawProductsRes>(`/products?categoryId=${product.categoryId}&limit=12`)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : (data.items ?? data.data ?? []);
        setSimilar(list.filter((p) => p.id !== id).slice(0, 8));
      })
      .catch(() => {/* skip */});
    return () => { cancelled = true; };
  }, [product?.categoryId, id]);

  const gallery = useMemo(() => (product ? buildGallery(product) : []), [product]);
  const numericPrice = useMemo(() => {
    if (!product) return 0;
    return typeof product.price === 'string' ? Number(product.price) : product.price;
  }, [product]);

  const inCart = items.some((i) => i.productId === id);
  const outOfStock = (product?.stock ?? 0) === 0;
  const total = numericPrice * qty;

  const handleAdd = () => {
    if (!product) return;
    if (!isLoggedIn) { setShowAuthGate(true); return; }
    setAdding(true);
    add({
      productId: product.id,
      title: product.title,
      price: numericPrice,
      quantity: qty,
      sellerId: product.seller?.id ?? product.sellerId ?? '',
      imageUrl: product.imageUrl,
      weightKg: product.weightKg !== undefined ? Number(product.weightKg) : undefined,
      requiresVehicle: product.requiresVehicle,
    }, qty);
    setTimeout(() => setAdding(false), 700);
  };

  if (loading) {
    return (
      <div className="page" style={{ padding: 0 }}>
        <Topbar onBack={() => router.back()} cartCount={safeCartCount} onCart={toggleCart} />
        <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)' }}>
          Yuklanmoqda…
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page" style={{ padding: 0 }}>
        <Topbar onBack={() => router.back()} cartCount={safeCartCount} onCart={toggleCart} />
        <div style={{ padding: 80, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Mahsulot topilmadi</div>
          <div style={{ color: 'var(--text-muted)', marginBottom: 18 }}>
            Bu mahsulot mavjud emas yoki o&apos;chirilgan
          </div>
          <button className="btn" onClick={() => router.push('/home')}>Bosh sahifa</button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page" style={{ padding: 0 }}>
      <Topbar onBack={() => router.back()} cartCount={count()} onCart={toggleCart} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px var(--space-4)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 32,
          alignItems: 'start',
        }} className="product-detail-grid">

          {/* Gallery */}
          <div>
            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1',
              borderRadius: 20,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
              border: '1px solid var(--border)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gallery[activeImage] ?? gallery[0] ?? ''}
                alt={product.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 200ms ease' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <button
                onClick={() => toggleFav(id)}
                aria-label={isFav ? 'Sevimlilardan o\'chirish' : 'Sevimlilarga qo\'shish'}
                style={{
                  position: 'absolute', top: 14, right: 14,
                  width: 44, height: 44, borderRadius: '50%',
                  border: 'none',
                  background: isFav ? '#ef4444' : 'rgba(255,255,255,0.95)',
                  color: isFav ? '#fff' : '#ef4444',
                  fontSize: 22,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  transition: 'transform 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'}
              >{isFav ? '♥' : '♡'}</button>

              {outOfStock && (
                <div style={{
                  position: 'absolute', bottom: 14, left: 14,
                  padding: '8px 16px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  color: '#fff',
                  borderRadius: 999,
                  fontSize: 12, fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}>Tugagan</div>
              )}
            </div>

            {gallery.length > 1 && (
              <div style={{
                marginTop: 12,
                display: 'grid',
                gridTemplateColumns: `repeat(${gallery.length}, 1fr)`,
                gap: 8,
              }}>
                {gallery.map((url, i) => (
                  <button
                    key={url}
                    onClick={() => setActiveImage(i)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: activeImage === i ? '2px solid #7C3AED' : '2px solid var(--border)',
                      cursor: 'pointer',
                      padding: 0,
                      background: '#f1f5f9',
                      transition: 'border 150ms ease',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Rasm ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info & Actions */}
          <div>
            {product.seller?.brandName && (
              <div style={{
                display: 'inline-block',
                fontSize: 11, fontWeight: 700,
                color: '#6D28D9',
                background: '#eef2ff',
                padding: '5px 12px',
                borderRadius: 999,
                marginBottom: 12,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}>{product.seller.brandName}</div>
            )}

            <h1 style={{
              fontSize: 30, fontWeight: 800,
              color: 'var(--text)',
              marginBottom: 10,
              letterSpacing: '-0.5px',
              lineHeight: 1.2,
            }}>{product.title}</h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, fontSize: 13, color: 'var(--text-muted)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: '#10b981' }}>●</span>
                <span>Zaxirada {product.stock} ta</span>
              </span>
              <span>•</span>
              <span>30 daqiqada yetkaziladi</span>
              {product.category?.name && <><span>•</span><span>{product.category.name}</span></>}
            </div>

            <div style={{
              fontSize: 36, fontWeight: 800,
              color: 'var(--text)',
              marginBottom: 22,
              letterSpacing: '-1px',
            }}>{money(numericPrice)} so&apos;m</div>

            {product.description && (
              <div style={{
                padding: '14px 16px',
                background: 'var(--surface-2, #f9fafb)',
                borderRadius: 14,
                border: '1px solid var(--border)',
                marginBottom: 22,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Tavsif
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {product.description}
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 18px',
              background: 'var(--surface-2, #f9fafb)',
              borderRadius: 14,
              border: '1px solid var(--border)',
              marginBottom: 16,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Miqdori</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 'auto' }}>
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  style={{
                    width: 38, height: 38, borderRadius: 10,
                    border: 'none',
                    background: qty <= 1 ? '#e5e7eb' : '#0f172a',
                    color: '#fff',
                    fontSize: 20, fontWeight: 700,
                    cursor: qty <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >−</button>
                <span style={{ minWidth: 40, textAlign: 'center', fontSize: 20, fontWeight: 800 }}>{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                  disabled={qty >= (product.stock || 99)}
                  style={{
                    width: 38, height: 38, borderRadius: 10,
                    border: 'none',
                    background: qty >= (product.stock || 99) ? '#e5e7eb' : '#0f172a',
                    color: '#fff',
                    fontSize: 20, fontWeight: 700,
                    cursor: qty >= (product.stock || 99) ? 'not-allowed' : 'pointer',
                  }}
                >+</button>
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={outOfStock || adding}
              style={{
                width: '100%',
                height: 56,
                border: 'none',
                borderRadius: 14,
                background: outOfStock ? '#e5e7eb' : 'linear-gradient(135deg, #7C3AED, #7C3AED)',
                color: '#fff',
                fontSize: 16, fontWeight: 700,
                letterSpacing: 0.3,
                cursor: outOfStock ? 'not-allowed' : 'pointer',
                boxShadow: outOfStock ? 'none' : '0 8px 20px rgba(79, 70, 229, 0.35)',
                transition: 'transform 150ms ease',
              }}
              onMouseEnter={(e) => { if (!outOfStock) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
            >
              {outOfStock ? 'Tugagan' : adding ? '✓ Qo\'shildi' : inCart ? `✓ Savatga qo'shish (${money(total)} so'm)` : `Savatga qo'shish · ${money(total)} so'm`}
            </button>
          </div>
        </div>

        {/* Similar products */}
        {similar.length > 0 && (
          <div style={{ marginTop: 56 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 18,
            }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>O&apos;xshash mahsulotlar</h2>
              <button
                onClick={() => router.push('/home')}
                style={{
                  background: 'transparent', border: 'none',
                  color: '#7C3AED', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >Barchasi →</button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 14,
              paddingBottom: 'calc(var(--bottom-nav-h) + 24px)',
            }}>
              {similar.map((p) => {
                const sPrice = typeof p.price === 'string' ? Number(p.price) : p.price;
                return (
                  <div
                    key={p.id}
                    onClick={() => { router.push(`/products/${p.id}`); setActiveImage(0); setQty(1); }}
                    className="product-card"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="product-card-image">
                      {p.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.title} loading="lazy" />
                      )}
                    </div>
                    <div className="product-card-body">
                      <div className="product-card-title">{p.title}</div>
                      {p.seller?.brandName && (
                        <div className="product-card-seller">{p.seller.brandName}</div>
                      )}
                      <div style={{ marginTop: 'auto', paddingTop: 4 }}>
                        <div className="product-card-price">{money(sPrice)} so&apos;m</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Auth gate */}
      {showAuthGate && (
        <div className="auth-gate-overlay" onClick={() => setShowAuthGate(false)}>
          <div className="auth-gate-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="auth-gate-icon">🔒</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Kirish talab qilinadi</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Mahsulotni savatga qo&apos;shish uchun avval tizimga kiring.
            </p>
            <button className="btn btn-full" style={{ height: 52, marginBottom: 12 }} onClick={() => router.push(`/login?redirect=/products/${id}`)}>Kirish</button>
            <button className="btn-ghost btn btn-full" style={{ height: 46 }} onClick={() => setShowAuthGate(false)}>Bekor qilish</button>
          </div>
        </div>
      )}

      <BottomNav />

      <style jsx>{`
        @media (max-width: 768px) {
          :global(.product-detail-grid) {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}

function Topbar({ onBack, cartCount, onCart }: { onBack: () => void; cartCount: number; onCart: () => void }) {
  return (
    <header className="top-nav" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="top-nav-inner" style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 1100, margin: '0 auto', padding: '0 var(--space-4)', height: 60 }}>
        <button
          onClick={onBack}
          aria-label="Orqaga"
          style={{
            width: 40, height: 40, borderRadius: 12,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: 20, lineHeight: 1,
            cursor: 'pointer',
          }}
        >←</button>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>Mahsulot</div>
        <button
          onClick={onCart}
          aria-label="Savat"
          style={{
            position: 'relative',
            width: 44, height: 44, borderRadius: 12,
            border: '2px solid var(--border)',
            background: 'var(--surface)',
            cursor: 'pointer', color: 'var(--text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          🛒
          {cartCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              minWidth: 20, height: 20, padding: '0 6px',
              background: '#ef4444', color: '#fff',
              borderRadius: 999,
              fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{cartCount > 9 ? '9+' : cartCount}</span>
          )}
        </button>
      </div>
    </header>
  );
}
