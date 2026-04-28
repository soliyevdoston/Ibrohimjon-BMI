'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, money } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { BottomNav } from '@/components/BottomNav';
import { CartDrawer } from '@/components/CartDrawer';
import { SkeletonList } from '@/components/SkeletonCard';

type Product = {
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

type Category = { id: string; name: string; icon: string };

const CATEGORIES: Category[] = [
  { id: '',            name: 'Barchasi',   icon: '◻' },
  { id: 'food',        name: 'Ovqat',      icon: '◻' },
  { id: 'grocery',     name: 'Oziq-ovqat', icon: '◻' },
  { id: 'electronics', name: 'Elektronika',icon: '◻' },
  { id: 'home',        name: 'Uy',         icon: '◻' },
  { id: 'beauty',      name: "Go'zallik",  icon: '◻' },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.97-1.67L23 6H6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function getCategoryLabel(categoryId?: string): string {
  const map: Record<string, string> = {
    food: '🍔', grocery: '🥗', electronics: '📱', home: '🏠', beauty: '💄',
  };
  return map[categoryId ?? ''] ?? '📦';
}

export default function HomePage() {
  const router = useRouter();
  const { init, accessToken } = useAuthStore();
  const { add, count, toggleCart, items } = useCartStore();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const cartCount = count();
  const isCartOpen = useCartStore((s) => s.isOpen);
  const isLoggedIn = !!accessToken;

  useEffect(() => { init(); }, [init]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (activeCategory) params.set('categoryId', activeCategory);
      const token = localStorage.getItem('access_token') ?? undefined;

      const data = await api<Product[] | { data: Product[] }>(
        `/products?${params.toString()}`,
        token ? { token } : {}
      );
      const list = Array.isArray(data) ? data : (data as { data: Product[] }).data ?? [];
      setProducts(list);
    } catch {
      setProducts(DEMO_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeCategory]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleAddToCart = (product: Product) => {
    if (!isLoggedIn) {
      setShowAuthGate(true);
      return;
    }
    setAddingId(product.id);
    add({
      productId: product.id,
      title: product.title,
      price: product.price,
      quantity: 1,
      sellerId: product.seller?.id ?? product.sellerId ?? '',
      imageUrl: product.imageUrl,
    });
    setTimeout(() => setAddingId(null), 600);
  };

  const inCart = (productId: string) => items.some((i) => i.productId === productId);

  const activeCategoryLabel = CATEGORIES.find((c) => c.id === activeCategory)?.name ?? 'Mahsulotlar';

  return (
    <div className="page" style={{ padding: 0 }}>
      {/* ===== TOP NAV ===== */}
      <header className="top-nav">
        <div className="top-nav-inner">
          <a href="/home" className="top-nav-brand">Lochin</a>

          {/* Desktop search */}
          <div className="top-nav-search hide-mobile">
            <div className="search-bar">
              <span className="search-icon"><SearchIcon /></span>
              <input
                type="search"
                placeholder="Mahsulot yoki do'kon qidirish…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1 }}>×</button>
              )}
            </div>
          </div>

          <div className="top-nav-actions">
            {/* Cart */}
            <button className="top-nav-cart-btn" onClick={isLoggedIn ? toggleCart : () => setShowAuthGate(true)} aria-label="Savat">
              <CartIcon />
              {cartCount > 0 && (
                <span className="top-nav-cart-badge">{cartCount > 9 ? '9+' : cartCount}</span>
              )}
            </button>

            {/* Auth button */}
            {isLoggedIn ? (
              <button
                onClick={() => router.push('/profile')}
                style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', border: '2px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)' }}
                aria-label="Profil"
              >
                <UserIcon />
              </button>
            ) : (
              <button
                className="btn btn-sm"
                onClick={() => router.push('/login')}
                style={{ height: 40, padding: '0 16px', fontSize: 14 }}
              >
                Kirish
              </button>
            )}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 var(--space-4)' }}>
        {/* Mobile search */}
        <div className="hide-desktop" style={{ padding: 'var(--space-4) 0 var(--space-3)' }}>
          <div className="search-bar">
            <span className="search-icon"><SearchIcon /></span>
            <input
              type="search"
              placeholder="Qidirish…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1 }}>×</button>
            )}
          </div>
        </div>

        {/* Hero banner (shown when no search/filter active) */}
        {!debouncedSearch && !activeCategory && (
          <div className="hero-banner" style={{ margin: '16px 0' }}>
            <div className="hero-banner-text">
              <div className="hero-banner-title">
                Tez va qulay yetkazib berish
              </div>
              <div className="hero-banner-sub">
                Minglab mahsulotlar — bir joyda.<br />
                30 daqiqada eshigingizgacha.
              </div>
              {!isLoggedIn && (
                <button
                  className="btn btn-sm"
                  style={{ marginTop: 16, padding: '0 20px', height: 40 }}
                  onClick={() => router.push('/login')}
                >
                  Buyurtma berish
                </button>
              )}
            </div>
            <div className="hero-banner-art">🛵</div>
          </div>
        )}

        {/* Category pills */}
        <div className="category-pills" style={{ padding: '4px 0 12px' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`category-pill${activeCategory === cat.id ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Section heading */}
        <div className="section-row">
          <span className="section-title">
            {debouncedSearch ? `"${debouncedSearch}" natijalari` : activeCategoryLabel === 'Barchasi' ? 'Barcha mahsulotlar' : activeCategoryLabel}
          </span>
          {!loading && <span className="section-count">{products.length} ta</span>}
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="product-grid" style={{ paddingBottom: 'calc(var(--bottom-nav-h) + 24px)' }}>
            <SkeletonList count={8} />
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state" style={{ paddingBottom: 'calc(var(--bottom-nav-h) + 24px)' }}>
            <div className="empty-state-icon" style={{ fontSize: 48, marginBottom: 4 }}>—</div>
            <div className="empty-state-title">Hech narsa topilmadi</div>
            <div className="empty-state-desc">Boshqa kalit so&apos;z yoki kategoriya tanlang</div>
            <button className="btn-ghost btn btn-sm" style={{ marginTop: 8 }} onClick={() => { setSearch(''); setActiveCategory(''); }}>
              Tozalash
            </button>
          </div>
        ) : (
          <div className="product-grid" style={{ paddingBottom: 'calc(var(--bottom-nav-h) + 24px)' }}>
            {products.map((product) => {
              const inCartAlready = inCart(product.id);
              const isAdding = addingId === product.id;
              const outOfStock = product.stock === 0;
              return (
                <div key={product.id} className="product-card">
                  <div
                    className="product-card-image"
                    style={{ background: product.imageUrl ? undefined : 'var(--surface-alt)' }}
                  >
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.imageUrl} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 40 }}>{getCategoryLabel(product.categoryId)}</span>
                    )}
                  </div>

                  <div className="product-card-body">
                    <div className="product-card-title">{product.title}</div>
                    {product.seller?.name && (
                      <div className="product-card-seller">{product.seller.name}</div>
                    )}
                    <div style={{ marginTop: 'auto', paddingTop: 4 }}>
                      <div className="product-card-price">{money(product.price)} so&apos;m</div>
                      {outOfStock && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Tugagan</div>
                      )}
                    </div>
                  </div>

                  <div className="product-card-footer">
                    <button
                      className={`btn btn-sm btn-full${inCartAlready ? ' btn-ghost' : ''}`}
                      style={{ fontSize: 13 }}
                      disabled={outOfStock || isAdding}
                      onClick={() => handleAddToCart(product)}
                    >
                      {isAdding ? '✓' : inCartAlready ? '✓ Savatda' : '+ Savatga'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== AUTH GATE MODAL ===== */}
      {showAuthGate && (
        <div className="auth-gate-overlay" onClick={() => setShowAuthGate(false)}>
          <div className="auth-gate-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="auth-gate-icon">
              <LockIcon />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
              Kirish talab qilinadi
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Mahsulotni savatga qo&apos;shish yoki buyurtma berish uchun avval tizimga kiring.
            </p>
            <button
              className="btn btn-full"
              style={{ height: 52, marginBottom: 12 }}
              onClick={() => router.push('/login?redirect=/home')}
            >
              Kirish
            </button>
            <button
              className="btn-ghost btn btn-full"
              style={{ height: 46 }}
              onClick={() => setShowAuthGate(false)}
            >
              Bekor qilish
            </button>
          </div>
        </div>
      )}

      <BottomNav />
      {isCartOpen && isLoggedIn && <CartDrawer />}
    </div>
  );
}

const DEMO_PRODUCTS: Product[] = [
  { id: '1', title: 'Osh (plov)',         price: 35000,   stock: 10, categoryId: 'food',        seller: { id: 's1', name: 'Osh markazi' } },
  { id: '2', title: "Lag'mon",            price: 25000,   stock: 5,  categoryId: 'food',        seller: { id: 's1', name: 'Osh markazi' } },
  { id: '3', title: 'Non',               price: 5000,    stock: 20, categoryId: 'grocery',     seller: { id: 's2', name: 'Yangi non' } },
  { id: '4', title: 'Samsung Galaxy A55', price: 4500000, stock: 3,  categoryId: 'electronics', seller: { id: 's3', name: 'Tech market' } },
  { id: '5', title: "Yostiq to'plami",    price: 120000,  stock: 8,  categoryId: 'home',        seller: { id: 's4', name: 'Dom market' } },
  { id: '6', title: 'Atir suvi',          price: 250000,  stock: 0,  categoryId: 'beauty',      seller: { id: 's5', name: 'Beauty shop' } },
  { id: '7', title: 'Manti',             price: 30000,   stock: 15, categoryId: 'food',        seller: { id: 's1', name: 'Osh markazi' } },
  { id: '8', title: 'Tuxum (10 ta)',      price: 22000,   stock: 50, categoryId: 'grocery',     seller: { id: 's2', name: 'Yangi non' } },
];
