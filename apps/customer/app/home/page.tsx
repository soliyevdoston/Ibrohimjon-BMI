'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
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

type Category = {
  id: string;
  name: string;
  emoji?: string;
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: '', name: 'Barchasi', emoji: '🌐' },
  { id: 'food', name: 'Ovqat', emoji: '🍔' },
  { id: 'grocery', name: 'Oziq-ovqat', emoji: '🛒' },
  { id: 'electronics', name: 'Elektronika', emoji: '📱' },
  { id: 'home', name: 'Uy', emoji: '🏠' },
  { id: 'beauty', name: 'Go\'zallik', emoji: '💄' },
];

const PRODUCT_COLORS = [
  'linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)',
  'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%)',
  'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)',
  'linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)',
  'linear-gradient(135deg, #fce7f3 0%, #f9a8d4 100%)',
  'linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 100%)',
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
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

  const debouncedSearch = useDebounce(search, 350);
  const cartCount = count();
  const isCartOpen = useCartStore((s) => s.isOpen);

  // Auth guard
  useEffect(() => {
    init();
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.replace('/login');
    }
  }, [init, router]);

  // Load products
  const loadProducts = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (activeCategory) params.set('categoryId', activeCategory);

      const data = await api<Product[] | { data: Product[] }>(
        `/products?${params.toString()}`,
        { token }
      );
      const list = Array.isArray(data) ? data : (data as { data: Product[] }).data ?? [];
      setProducts(list);
    } catch {
      // Use demo data if API unavailable
      setProducts(DEMO_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeCategory]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleAddToCart = (product: Product) => {
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

  return (
    <div className="page">
      {/* Sticky header */}
      <div className="sticky-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>
              Yetkazib berish
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
              📍 Toshkent shahri
            </div>
          </div>

          {/* Cart button */}
          <button
            className="btn-icon btn"
            onClick={toggleCart}
            style={{ position: 'relative', background: 'var(--primary-light)', color: 'var(--primary)' }}
            aria-label="Savatni ochish"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.97-1.67L23 6H6" />
            </svg>
            {cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  background: 'var(--danger)',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  border: '2px solid #fff',
                }}
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Search bar */}
        <div className="search-bar">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Mahsulot yoki do'kon qidirish…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="category-pills">
          {DEFAULT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`category-pill${activeCategory === cat.id ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 16px 0' }}>
        {/* Section heading */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>
            {activeCategory
              ? DEFAULT_CATEGORIES.find((c) => c.id === activeCategory)?.name ?? 'Mahsulotlar'
              : debouncedSearch
              ? `"${debouncedSearch}" natijalari`
              : 'Barcha mahsulotlar'}
          </h2>
          {!loading && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
              {products.length} ta
            </span>
          )}
        </div>

        {loading ? (
          <div className="product-grid">
            <SkeletonList count={6} />
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">Hech narsa topilmadi</div>
            <div className="empty-state-desc">
              Boshqa kalit so&apos;z yoki kategoriya tanlang
            </div>
            <button
              className="btn btn-ghost"
              style={{ marginTop: 8 }}
              onClick={() => { setSearch(''); setActiveCategory(''); }}
            >
              Tozalash
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product, idx) => {
              const inCartAlready = inCart(product.id);
              return (
                <div key={product.id} className="product-card">
                  {/* Image */}
                  <div
                    className="product-card-image"
                    style={{ background: product.imageUrl ? undefined : PRODUCT_COLORS[idx % PRODUCT_COLORS.length] }}
                  >
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: 36 }}>
                        {getCategoryEmoji(product.categoryId)}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="product-card-body">
                    <div className="product-card-title">{product.title}</div>
                    {product.seller?.name && (
                      <div className="product-card-seller">🏪 {product.seller.name}</div>
                    )}
                    <div style={{ marginTop: 'auto', paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div className="product-card-price">{money(product.price)} so&apos;m</div>
                      {product.stock !== undefined && (
                        <div style={{ fontSize: 11, color: product.stock > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                          {product.stock > 0 ? `${product.stock} ta bor` : 'Tugagan'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add to cart footer */}
                  <div className="product-card-footer">
                    <button
                      className={`btn btn-sm btn-full${inCartAlready ? ' btn-ghost' : ''}`}
                      style={{ fontSize: 13 }}
                      disabled={product.stock === 0 || addingId === product.id}
                      onClick={() => handleAddToCart(product)}
                    >
                      {addingId === product.id ? (
                        '✓ Qo\'shildi'
                      ) : inCartAlready ? (
                        '✓ Savatda'
                      ) : (
                        '+ Savatga'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
      {isCartOpen && <CartDrawer />}
    </div>
  );
}

function getCategoryEmoji(categoryId?: string): string {
  const map: Record<string, string> = {
    food: '🍔',
    grocery: '🥗',
    electronics: '📱',
    home: '🏠',
    beauty: '💄',
    '': '📦',
  };
  return map[categoryId ?? ''] ?? '📦';
}

// Demo products for when API is unavailable
const DEMO_PRODUCTS: Product[] = [
  { id: '1', title: 'Osh (plov)', price: 35000, stock: 10, categoryId: 'food', seller: { id: 's1', name: 'Osh markazi' } },
  { id: '2', title: 'Lag\'mon', price: 25000, stock: 5, categoryId: 'food', seller: { id: 's1', name: 'Osh markazi' } },
  { id: '3', title: 'Non', price: 5000, stock: 20, categoryId: 'grocery', seller: { id: 's2', name: 'Yangi non' } },
  { id: '4', title: 'Samsung Galaxy A55', price: 4500000, stock: 3, categoryId: 'electronics', seller: { id: 's3', name: 'Tech market' } },
  { id: '5', title: 'Yostiq to\'plami', price: 120000, stock: 8, categoryId: 'home', seller: { id: 's4', name: 'Dom market' } },
  { id: '6', title: 'Atir suvi', price: 250000, stock: 0, categoryId: 'beauty', seller: { id: 's5', name: 'Beauty shop' } },
  { id: '7', title: 'Manti', price: 30000, stock: 15, categoryId: 'food', seller: { id: 's1', name: 'Osh markazi' } },
  { id: '8', title: 'Tuxum (10 ta)', price: 22000, stock: 50, categoryId: 'grocery', seller: { id: 's2', name: 'Yangi non' } },
];
