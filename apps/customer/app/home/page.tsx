'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, money, imgUrl } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { useFavoritesStore } from '@/stores/favorites';
import { BottomNav } from '@/components/BottomNav';
import { SkeletonList } from '@/components/SkeletonCard';

type Product = {
  id: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number | null;
  stock: number;
  imageUrl?: string;
  categoryId?: string;
  categorySlug?: string;
  seller?: { id: string; name: string };
  sellerId?: string;
  weightKg?: number;
  requiresVehicle?: 'BIKE' | 'CAR' | 'VAN' | 'TRUCK';
  isFragile?: boolean;
  isOversized?: boolean;
};

type Category = { id: string; slug: string; name: string; icon: string };

const CATEGORY_LABELS: Record<string, { name: string; icon: string }> = {
  mebel:        { name: 'Mebel',              icon: '' },
  yogoch:       { name: "Yog'och mahsulotlar", icon: '' },
  appliances:   { name: 'Texnika',            icon: '' },
  construction: { name: 'Qurilish',           icon: '' },
  sport:        { name: 'Sport',              icon: '' },
  garden:       { name: "Bog' va dacha",      icon: '' },
  electronics:  { name: 'Elektronika',        icon: '' },
  home:         { name: "Uy-ro'zg'or",        icon: '' },
  textile:      { name: 'Matolar',            icon: '' },
  metal:        { name: 'Metall buyumlar',    icon: '' },
  handmade:     { name: 'Qo\'lda ishlangan',  icon: '' },
  other:        { name: 'Boshqalar',          icon: '' },
};

const ALL_CATEGORY: Category = { id: '', slug: '', name: 'Barchasi', icon: '◻' };

type Slide = { image: string; title: string; sub: string };

const UNS = (id: string) => `https://images.unsplash.com/${id}?w=1400&q=80&auto=format&fit=crop`;

const BANNER_BY_SLUG: Record<string, Slide[]> = {
  '': [
    { image: UNS('photo-1555041469-a586c61ea9bc'), title: 'Mahalliy ishlab chiqaruvchilardan', sub: 'Mebel, yog\'och buyumlar, qurilish materiallari — to\'g\'ridan-to\'g\'ri ishlab chiqaruvchidan.' },
    { image: UNS('photo-1586023492125-27b2c045efd7'), title: 'Sifatli mebel, qulay narx', sub: 'Mahalliy ustalar qo\'lida yaratilgan zamonaviy mebel va uy jihozlari.' },
    { image: UNS('photo-1540558170815-6ee1c6e9afdc'), title: 'Qurilish materiallari', sub: 'Ishonchli va sertifikatlangan mahalliy ishlab chiqaruvchilardan bevosita.' },
    { image: UNS('photo-1618221195710-dd6b41faaea6'), title: 'Buyurtma — To\'lov — Yetkazib berish', sub: 'Uch bosqichli oddiy jarayon: buyurtma bering, naqd to\'lang, qabul qiling.' },
  ],
  mebel: [
    { image: UNS('photo-1555041469-a586c61ea9bc'), title: 'Zamonaviy mebel', sub: 'Divan, krovat, shkaflar — mahalliy ustalardan.' },
    { image: UNS('photo-1586023492125-27b2c045efd7'), title: 'Uy interyeri uchun', sub: 'Har bir xonangizga mos mebel — buyurtma asosida.' },
  ],
  yogoch: [
    { image: UNS('photo-1540558170815-6ee1c6e9afdc'), title: "Yog'och mahsulotlar", sub: "Tabiiy yog'ochdan yasalgan buyumlar — sifat va chidamlilik." },
    { image: UNS('photo-1560448205-4d9b3e6bb6db'), title: 'Qo\'lda ishlangan', sub: "Mahalliy ustalar tomonidan yaratilgan noyob yog'och buyumlar." },
  ],
  construction: [
    { image: UNS('photo-1504307651254-35680f356dfd'), title: 'Qurilish materiallari', sub: 'G\'isht, tsement, taxta — ishonchli mahalliy yetkazuvchilardan.' },
    { image: UNS('photo-1581094794329-c8112a89af12'), title: 'Professional qurilish', sub: 'Barcha turdagi qurilish materiallari bir platformada.' },
  ],
  appliances: [
    { image: UNS('photo-1556909114-f6e7ad7d3136'), title: 'Maishiy texnika', sub: 'Oshxona va uy uchun zamonaviy texnika mahsulotlari.' },
    { image: UNS('photo-1574269909862-7e1d70bb8078'), title: 'Sifatli brendlar', sub: 'Kafolatlangan va sertifikatlangan mahsulotlar.' },
  ],
  electronics: [
    { image: UNS('photo-1592750475338-74b7b21085ab'), title: 'Elektronika', sub: 'Kompyuter, telefon va boshqa elektronika mahsulotlari.' },
    { image: UNS('photo-1517336714731-489689fd1ca8'), title: 'Zamonaviy gadjetlar', sub: 'Eng so\'nggi texnologiyalar — raqobatbardosh narxlarda.' },
  ],
  home: [
    { image: UNS('photo-1631049307264-da0ec9d70304'), title: "Uy-ro'zg'or buyumlari", sub: "Kundalik hayot uchun sifatli uy-ro'zg'or mahsulotlari." },
    { image: UNS('photo-1565374790459-72c35adb3aab'), title: 'Yoritish va bezak', sub: "Uyingizni zamonaviy tarzda bezang — LED chiroqlar va ko'proq." },
  ],
};

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
    mebel: 'M', yogoch: 'Y', appliances: 'T', construction: 'Q',
    sport: 'S', garden: 'B', electronics: 'E', home: 'U',
    textile: 'Mt', metal: 'Me', handmade: 'Q', other: 'B',
  };
  return map[categoryId ?? ''] ?? '';
}

function vehicleBadge(v?: 'BIKE' | 'CAR' | 'VAN' | 'TRUCK') {
  if (!v || v === 'BIKE') return null;
  const m = {
    CAR:   { label: 'Avto' },
    VAN:   { label: 'Furgon' },
    TRUCK: { label: 'Yuk mashinasi' },
  } as const;
  return m[v];
}

export default function HomePage() {
  const router = useRouter();
  const { init, accessToken } = useAuthStore();
  const { add, count, items, updateQty, subtotal } = useCartStore();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([ALL_CATEGORY]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [adminBanners, setAdminBanners] = useState<{ id: string; title: string; imageUrl: string; linkUrl: string | null }[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  const initFavs = useFavoritesStore((s) => s.init);
  const favIds = useFavoritesStore((s) => s.ids);
  const toggleFav = useFavoritesStore((s) => s.toggle);
  useEffect(() => { initFavs(); }, [initFavs]);

  // Pull admin-managed banners (promo slides). If none exist, the hero
  // section below stays on the static category-themed fallback.
  useEffect(() => {
    api<{ id: string; title: string; imageUrl: string; linkUrl: string | null }[]>('/banners')
      .then(setAdminBanners)
      .catch(() => setAdminBanners([]));
  }, []);

  // Recently viewed — populated from localStorage written by the product
  // detail page. We resolve the IDs against the freshly-loaded products list.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const ids = JSON.parse(localStorage.getItem('lochin.recently-viewed.v1') ?? '[]') as string[];
      if (!ids.length) return;
      const map = new Map(products.map((p) => [p.id, p]));
      const list = ids.map((id) => map.get(id)).filter((p): p is Product => !!p).slice(0, 8);
      setRecentlyViewed(list);
    } catch {/* ignore */}
  }, [products]);

  const activeSlug = categories.find((c) => c.id === activeCategory)?.slug ?? '';
  const slides = BANNER_BY_SLUG[activeSlug] ?? BANNER_BY_SLUG[''];
  const slide = slides[bannerIdx % slides.length];

  // Reset rotation when category changes
  useEffect(() => { setBannerIdx(0); }, [activeSlug]);

  // Rotate banner slide every 4.5s
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => {
      setBannerIdx((i) => (i + 1) % slides.length);
    }, 4500);
    return () => clearInterval(t);
  }, [slides.length]);

  const debouncedSearch = useDebounce(search, 350);
  const rawCartCount = count();
  const isLoggedIn = !!accessToken;

  // Hydration-safe: persisted cart only available on client
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  const cartCount = hydrated ? rawCartCount : 0;

  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState(0);
  useEffect(() => {
    api<{ freeDeliveryAbove: number }>('/health/config')
      .then((d) => setFreeDeliveryAbove(d.freeDeliveryAbove ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    let cancelled = false;
    api<Array<{ id: string; name: string; slug: string }>>('/products/categories')
      .then((data) => {
        if (cancelled) return;
        const list: Category[] = (Array.isArray(data) ? data : []).map((c) => {
          const meta = CATEGORY_LABELS[c.slug] ?? { name: c.name, icon: '📦' };
          return { id: c.id, slug: c.slug, name: meta.name, icon: meta.icon };
        });
        setCategories([ALL_CATEGORY, ...list]);
      })
      .catch(() => {/* keep "Barchasi" only */});
    return () => { cancelled = true; };
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (activeCategory) params.set('categoryId', activeCategory);
      const token = localStorage.getItem('access_token') ?? undefined;

      type RawProduct = {
        id: string; title: string; description?: string;
        price: number | string;
        originalPrice?: number | string | null;
        stock: number;
        imageUrl?: string; categoryId?: string;
        sellerId?: string;
        seller?: { id?: string; name?: string; brandName?: string };
        weightKg?: number | string;
        requiresVehicle?: 'BIKE' | 'CAR' | 'VAN' | 'TRUCK';
        isFragile?: boolean;
        isOversized?: boolean;
        category?: { slug?: string };
      };
      const data = await api<RawProduct[] | { items?: RawProduct[]; data?: RawProduct[] }>(
        `/products?${params.toString()}`,
        token ? { token } : {}
      );
      const raw: RawProduct[] = Array.isArray(data)
        ? data
        : (data as { items?: RawProduct[]; data?: RawProduct[] }).items
          ?? (data as { items?: RawProduct[]; data?: RawProduct[] }).data
          ?? [];
      const list: Product[] = raw.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        price: typeof p.price === 'string' ? Number(p.price) : p.price,
        originalPrice: p.originalPrice == null ? null : Number(p.originalPrice),
        stock: p.stock,
        imageUrl: p.imageUrl,
        categoryId: p.categoryId,
        categorySlug: p.category?.slug,
        sellerId: p.sellerId,
        seller: p.seller
          ? { id: p.seller.id ?? '', name: p.seller.name ?? p.seller.brandName ?? '' }
          : undefined,
        weightKg: typeof p.weightKg === 'string' ? Number(p.weightKg) : p.weightKg,
        requiresVehicle: p.requiresVehicle ?? 'BIKE',
        isFragile: p.isFragile,
        isOversized: p.isOversized,
      }));
      setProducts(list);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeCategory]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleAddToCart = (product: Product, qty: number = 1) => {
    if (!isLoggedIn) {
      setShowAuthGate(true);
      return;
    }
    setAddingId(product.id);
    add({
      productId: product.id,
      title: product.title,
      price: product.price,
      quantity: qty,
      sellerId: product.seller?.id ?? product.sellerId ?? '',
      imageUrl: product.imageUrl,
      weightKg: product.weightKg,
      requiresVehicle: product.requiresVehicle,
    }, qty);
    setTimeout(() => setAddingId(null), 600);
  };

  const openDetail = (product: Product) => {
    router.push(`/products/${product.id}`);
  };

  const inCart = (productId: string) => items.some((i) => i.productId === productId);
  const cartQty = (productId: string) => items.find((i) => i.productId === productId)?.quantity ?? 0;

  const activeCategoryLabel = categories.find((c) => c.id === activeCategory)?.name ?? 'Mahsulotlar';

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
            {/* Top icon — navigates to orders page */}
            <button
              className="top-nav-cart-btn"
              onClick={() => {
                if (!isLoggedIn) { setShowAuthGate(true); return; }
                router.push('/orders');
              }}
              aria-label="Buyurtmalar"
            >
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

        {/* Hero banner (always visible, rotates per category) */}
        {!debouncedSearch && (
          <div
            className="hero-banner"
            style={{
              margin: '16px 0',
              backgroundImage: `linear-gradient(100deg, rgba(15, 23, 42, 0.82) 0%, rgba(15, 23, 42, 0.55) 50%, rgba(15, 23, 42, 0.15) 100%), url('${slide.image}')`,
            }}
          >
            <div className="hero-banner-text" key={`${activeSlug}-${bannerIdx}`} style={{ animation: 'bannerFadeIn 500ms ease' }}>
              <div className="hero-banner-title">{slide.title}</div>
              <div className="hero-banner-sub" style={{ whiteSpace: 'pre-line' }}>
                {slide.sub}
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

            {/* Pagination dots */}
            {slides.length > 1 && (
              <div style={{
                position: 'absolute',
                bottom: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 6,
                zIndex: 2,
              }}>
                {slides.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Slayd ${i + 1}`}
                    onClick={() => setBannerIdx(i)}
                    style={{
                      width: bannerIdx === i ? 24 : 8,
                      height: 8,
                      padding: 0,
                      borderRadius: 999,
                      border: 'none',
                      background: bannerIdx === i ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
                      cursor: 'pointer',
                      transition: 'width 250ms ease, background 250ms ease',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin-managed promotional banners */}
        {adminBanners.length > 0 && !debouncedSearch && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              padding: '12px 0',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {adminBanners.map((b) => (
              <div
                key={b.id}
                onClick={() => b.linkUrl && (window.location.href = b.linkUrl)}
                style={{
                  flex: '0 0 80%',
                  scrollSnapAlign: 'start',
                  cursor: b.linkUrl ? 'pointer' : 'default',
                  borderRadius: 14,
                  overflow: 'hidden',
                  position: 'relative',
                  aspectRatio: '21 / 9',
                  background: `url(${imgUrl(b.imageUrl)}) center/cover no-repeat, #f1f5f9`,
                }}
              >
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  padding: '20px 14px 12px',
                  color: '#fff', fontWeight: 700, fontSize: 14,
                }}>
                  {b.title}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Free delivery progress bar */}
        {hydrated && freeDeliveryAbove > 0 && cartCount > 0 && (() => {
          const sub = subtotal();
          const isFree = sub >= freeDeliveryAbove;
          const left = freeDeliveryAbove - sub;
          const pct = Math.min(100, Math.round((sub / freeDeliveryAbove) * 100));
          return (
            <div style={{
              margin: '0 0 12px',
              padding: '10px 14px',
              background: isFree ? 'var(--primary-light)' : 'var(--surface-alt)',
              border: `1.5px solid ${isFree ? 'var(--primary)' : 'var(--border-dark)'}`,
              borderRadius: 12,
            }}>
              {isFree ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--primary-dark)' }}>
                  Bepul yetkazib berish qo&apos;llanadi!
                  <button onClick={() => router.push('/checkout')}
                    style={{ marginLeft: 'auto', fontSize: 12, padding: '4px 12px', borderRadius: 999, background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                    To&apos;lovga o&apos;tish
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text)', marginBottom: 6 }}>
                    <span>Yana <strong>{String(Math.round(left)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so&apos;m</strong> — bepul yetkazib berish</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--primary)', borderRadius: 999, width: `${pct}%`, transition: 'width 0.4s' }} />
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Category pills */}
        <div className="category-pills" style={{ padding: '4px 0 12px' }}>
          {categories.map((cat) => (
            <button
              key={cat.id || 'all'}
              className={`category-pill${activeCategory === cat.id ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span style={{ fontSize: 15 }}>{cat.icon}</span>
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
              const isFav = favIds.has(product.id);
              return (
                <div key={product.id} className="product-card" onClick={() => openDetail(product)} style={{ cursor: 'pointer' }}>
                  <div className="product-card-image">
                    {outOfStock && <span className="product-card-stock-badge">Tugagan</span>}

                    {(() => {
                      const v = vehicleBadge(product.requiresVehicle);
                      if (!v) return null;
                      return (
                        <span style={{
                          position: 'absolute', top: 8, left: 8, zIndex: 1,
                          background: 'rgba(17, 24, 39, 0.92)', color: '#fff',
                          fontSize: 10, fontWeight: 700,
                          padding: '4px 8px', borderRadius: 8,
                          letterSpacing: '0.3px',
                        }}>
                          {v.label}
                        </span>
                      );
                    })()}

                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFav(product.id); }}
                      aria-label={isFav ? "Sevimlilardan o'chirish" : 'Sevimlilarga qo\'shish'}
                      style={{
                        position: 'absolute',
                        top: 8, right: 8,
                        width: 32, height: 32,
                        borderRadius: '50%',
                        border: 'none',
                        background: isFav ? '#ef4444' : 'rgba(255,255,255,0.92)',
                        color: isFav ? '#fff' : '#6b7280',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                        zIndex: 1,
                        transition: 'transform 150ms ease, background 150ms ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                    </button>

                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imgUrl(product.imageUrl)}
                        alt={product.title}
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                          const parent = (e.currentTarget as HTMLImageElement).parentElement;
                          if (parent && !parent.querySelector('.fallback-emoji')) {
                            const span = document.createElement('span');
                            span.className = 'fallback-emoji';
                            span.style.fontSize = '40px';
                            span.textContent = getCategoryLabel(product.categorySlug);
                            parent.appendChild(span);
                          }
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 40 }}>{getCategoryLabel(product.categorySlug)}</span>
                    )}
                  </div>

                  <div className="product-card-body">
                    <div className="product-card-title">{product.title}</div>
                    {product.seller?.name && (
                      <div className="product-card-seller">{product.seller.name}</div>
                    )}
                    {(product.weightKg ?? 0) >= 5 && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
                        marginTop: 4,
                      }}>
                        ⚖ {product.weightKg} kg
                        {product.isFragile && <span style={{ color: '#ea580c' }}>· mo&apos;rt</span>}
                      </div>
                    )}
                    <div style={{ marginTop: 'auto', paddingTop: 4 }}>
                      <div className="hstack" style={{ gap: 6, alignItems: 'baseline', flexWrap: 'wrap' }}>
                        <div className="product-card-price">{money(product.price)} so&apos;m</div>
                        {product.originalPrice && Number(product.originalPrice) > product.price && (
                          <>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                              {money(Number(product.originalPrice))}
                            </span>
                            <span style={{
                              fontSize: 10, fontWeight: 700, color: '#10b981',
                              background: '#dcfce7', padding: '2px 6px', borderRadius: 6,
                            }}>
                              −{Math.round((1 - product.price / Number(product.originalPrice)) * 100)}%
                            </span>
                          </>
                        )}
                      </div>
                      {outOfStock && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Tugagan</div>
                      )}
                    </div>
                  </div>

                  <div className="product-card-footer">
                    {inCartAlready ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 6,
                        height: 36,
                        padding: '0 6px',
                        background: 'linear-gradient(135deg, #7C3AED, #7C3AED)',
                        borderRadius: 10,
                        boxShadow: '0 4px 12px rgba(79,70,229,.3)',
                      }} onClick={(e) => e.stopPropagation()}>
                        <button
                          aria-label="Kamaytirish"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQty(product.id, cartQty(product.id) - 1);
                          }}
                          style={{
                            width: 28, height: 28,
                            borderRadius: 8,
                            border: 'none',
                            background: 'rgba(255,255,255,0.22)',
                            color: '#fff',
                            fontSize: 16, fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >−</button>
                        <span style={{
                          color: '#fff', fontWeight: 800, fontSize: 14,
                          minWidth: 24, textAlign: 'center',
                        }}>{cartQty(product.id)}</span>
                        <button
                          aria-label="Ko'paytirish"
                          disabled={outOfStock || cartQty(product.id) >= (product.stock || 99)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          style={{
                            width: 28, height: 28,
                            borderRadius: 8,
                            border: 'none',
                            background: 'rgba(255,255,255,0.22)',
                            color: '#fff',
                            fontSize: 16, fontWeight: 800,
                            cursor: 'pointer',
                            opacity: cartQty(product.id) >= (product.stock || 99) ? 0.5 : 1,
                          }}
                        >+</button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-sm btn-full"
                        style={{ fontSize: 13 }}
                        disabled={outOfStock || isAdding}
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                      >
                        {isAdding ? '✓ Qo\'shildi' : '+ Savatga'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recently viewed rail */}
        {recentlyViewed.length > 0 && !debouncedSearch && (
          <div style={{ marginTop: 32, marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, padding: '0 4px' }}>
              Yaqinda ko&apos;rilganlar
            </h3>
            <div style={{
              display: 'flex', gap: 10, overflowX: 'auto',
              padding: '4px 4px 12px', scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
            }}>
              {recentlyViewed.map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/products/${p.id}`)}
                  style={{
                    flex: '0 0 140px', scrollSnapAlign: 'start',
                    cursor: 'pointer', background: 'var(--surface)',
                    border: '1px solid var(--border)', borderRadius: 12,
                    overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  }}
                >
                  <div style={{ aspectRatio: '1', background: '#f1f5f9', position: 'relative' }}>
                    {p.imageUrl && (
                      <img src={imgUrl(p.imageUrl)} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div style={{ padding: 8 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 600, lineHeight: 1.3,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden', minHeight: 32,
                    }}>{p.title}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, marginTop: 4 }}>
                      {money(p.price)} so&apos;m
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
    </div>
  );
}

