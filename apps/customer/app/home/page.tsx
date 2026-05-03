'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, money } from '@/lib/api';
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
  // Logistics-first
  mebel:        { name: 'Mebel',            icon: '🛋️' },
  appliances:   { name: 'Texnika',          icon: '🔌' },
  construction: { name: 'Qurilish',         icon: '🧱' },
  sport:        { name: 'Sport',            icon: '🚴' },
  garden:       { name: "Bog' va dacha",    icon: '🌳' },
  // Existing
  electronics:  { name: 'Smart',            icon: '📱' },
  home:         { name: "Uy-ro'zg'or",      icon: '🏠' },
  bakery:       { name: 'Tortlar',          icon: '🎂' },
  drinks:       { name: 'Ichimliklar',      icon: '🥤' },
  sweets:       { name: 'Shirinliklar',     icon: '🍫' },
  pharmacy:     { name: 'Dorixona',         icon: '💊' },
  beauty:       { name: "Go'zallik",        icon: '💄' },
};

const ALL_CATEGORY: Category = { id: '', slug: '', name: 'Barchasi', icon: '◻' };

type Slide = { image: string; title: string; sub: string; emoji: string };

const UNS = (id: string) => `https://images.unsplash.com/${id}?w=1400&q=80&auto=format&fit=crop`;

const BANNER_BY_SLUG: Record<string, Slide[]> = {
  '': [
    { image: UNS('photo-1604329760661-e71dc83f8f26'), emoji: '🛵', title: 'Tez va qulay yetkazib berish', sub: 'Minglab mahsulotlar — bir joyda.\n30 daqiqada eshigingizgacha.' },
    { image: UNS('photo-1578985545062-69928b1d9587'), emoji: '🍰', title: 'Tortlar va shirinliklar', sub: 'Tug\'ilgan kun va bayramlar uchun mukammal tanlov.' },
    { image: UNS('photo-1592750475338-74b7b21085ab'), emoji: '📱', title: 'Eng so\'nggi texnika', sub: 'iPhone, MacBook, AirPods — yangi avlod gadjetlari.' },
    { image: UNS('photo-1606312619070-d48b4c652a52'), emoji: '🍫', title: 'Shokolad va shirinliklar', sub: 'Eng yaxshi brendlar — uzoq saqlanadigan ta\'mlar.' },
    { image: UNS('photo-1622597467836-f3e6b3c5f6e0'), emoji: '🎁', title: 'Birinchi buyurtmaga 15% chegirma', sub: 'Yangi mijozlar uchun maxsus taklif.' },
  ],
  drinks: [
    { image: UNS('photo-1554866585-cd94860890b7'), emoji: '🥤', title: 'Idishlangan ichimliklar', sub: 'Coca-Cola, mineral suv, sharbatlar — uzoq saqlanadi.' },
    { image: UNS('photo-1556679343-c7306c1976bc'), emoji: '🍵', title: 'Quruq choy paketi', sub: 'Yashil va qora choy — uy zaxirangiz uchun.' },
    { image: UNS('photo-1622597467836-f3e6b3c5f6e0'), emoji: '🧃', title: 'Tabiiy sharbatlar', sub: 'Idishlangan, qo\'shimchasiz, sevimli ta\'mlar.' },
    { image: UNS('photo-1564419320461-6870880221ad'), emoji: '💧', title: 'Mineral suv zaxirasi', sub: '1.5L idishlarda — kuniga 8 stakan.' },
  ],
  bakery: [
    { image: UNS('photo-1578985545062-69928b1d9587'), emoji: '🎂', title: 'Tortlar bayramingizga', sub: 'Shokoladli, Napoleon, Medovik — har didga.' },
    { image: UNS('photo-1524351199678-941a58a3df50'), emoji: '🍰', title: 'Cheesecake va Tiramisu', sub: 'Italyan va Amerika klassikasi.' },
    { image: UNS('photo-1486427944299-d1955d23e34d'), emoji: '🍮', title: 'Hashamat tortlari', sub: 'Maxsus buyurtma asosida tayyorlangan.' },
    { image: UNS('photo-1499636136210-6f4ee915583e'), emoji: '🍪', title: 'Cookies to\'plami', sub: 'Shokolad bo\'laklari bilan — uzoq saqlanadi.' },
  ],
  sweets: [
    { image: UNS('photo-1606312619070-d48b4c652a52'), emoji: '🍫', title: 'Shokolad olami', sub: 'Milka, Lindt, sutli va qora — eng yaxshi brendlar.' },
    { image: UNS('photo-1587049352846-4a222e784d38'), emoji: '🍯', title: 'Tabiiy asal', sub: 'Tog\' asali — yillab saqlanadi, har lazzat uchun.' },
    { image: UNS('photo-1582716401301-b2407dc7563d'), emoji: '🍡', title: 'An\'anaviy halva', sub: 'O\'zbek halvasi va konfetlar.' },
    { image: UNS('photo-1582058091505-f87a2e55a40f'), emoji: '🍬', title: 'Mevali marmaladlar', sub: 'Bolalar uchun shirin sovg\'a.' },
  ],
  pharmacy: [
    { image: UNS('photo-1471864190281-a93a3070b6de'), emoji: '💊', title: 'Vitamin va biofaol', sub: 'Immunitetni mustahkamlovchi vositalar.' },
    { image: UNS('photo-1584308666744-24d5c474f2ae'), emoji: '🩺', title: 'Asosiy dorilar uyingizda', sub: 'Paracetamol, antiseptik — har xonadonda kerakli.' },
    { image: UNS('photo-1626516890025-6b3f24f5bd2b'), emoji: '🌿', title: 'Multivitamin Centrum', sub: 'Bir tabletkada barcha kerakli vitamin.' },
  ],
  electronics: [
    { image: UNS('photo-1592750475338-74b7b21085ab'), emoji: '📱', title: 'iPhone 15 yangi avlodi', sub: 'Titanium qalpoq, A17 Pro chip — eng so\'nggi texnologiya.' },
    { image: UNS('photo-1517336714731-489689fd1ca8'), emoji: '💻', title: 'MacBook Air M3', sub: 'Yangi M3 chipi, kuchli ishlash, kichik o\'lcham.' },
    { image: UNS('photo-1606220945770-b5b6c2c55bf1'), emoji: '🎧', title: 'AirPods Pro 2', sub: 'Active noise cancellation — tovushga botgan dunyo.' },
    { image: UNS('photo-1610945265064-0e34e5519bbf'), emoji: '📲', title: 'Samsung Galaxy', sub: 'AMOLED ekran, eng yaxshi kamera — Android boshqa darajada.' },
    { image: UNS('photo-1593359677879-a4bb92f829d1'), emoji: '📺', title: 'Smart TV va aksessuarlar', sub: '4K QLED ekran — uyingizda kinoteatr.' },
  ],
  home: [
    { image: UNS('photo-1631049307264-da0ec9d70304'), emoji: '🛏', title: 'Yumshoq yostiq va adyol', sub: 'Tabiiy paxta, yumshoq tinch uyqu uchun.' },
    { image: UNS('photo-1565374790459-72c35adb3aab'), emoji: '💡', title: 'Zamonaviy yoritish', sub: 'LED chiroqlar, smart lampalar — uyga energiya.' },
    { image: UNS('photo-1547074620-f17b3f0bcaa5'), emoji: '🍳', title: 'Oshxona texnikalari', sub: 'Choynak, blender, mikser — har taomingizga.' },
  ],
  beauty: [
    { image: UNS('photo-1541643600914-78b084683601'), emoji: '💎', title: 'Hashamatli atirlar', sub: 'Chanel, Dior, Gucci — siz haqiqiy ayol.' },
    { image: UNS('photo-1586495777744-4413f21062fa'), emoji: '💋', title: 'MAC va boshqa kosmetika', sub: 'Lab pomadasi, tushli boyoqlar — har lukni mukammal qiling.' },
    { image: UNS('photo-1556228720-195a672e8a03'), emoji: '✨', title: 'Teri parvarishi', sub: 'La Roche-Posay, Vichy — terining sog\'ligi sizniki.' },
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
  // Note: this is keyed by category SLUG (passed in from caller).
  const map: Record<string, string> = {
    mebel: '🛋️', appliances: '🔌', construction: '🧱',
    sport: '🚴', garden: '🌳', electronics: '📱', home: '🏠',
    bakery: '🎂', drinks: '🥤', sweets: '🍫',
    pharmacy: '💊', beauty: '💄',
  };
  return map[categoryId ?? ''] ?? '📦';
}

function vehicleBadge(v?: 'BIKE' | 'CAR' | 'VAN' | 'TRUCK') {
  if (!v || v === 'BIKE') return null;
  const m = {
    CAR:   { icon: '🚗', label: 'Avto' },
    VAN:   { icon: '🚐', label: 'Furgon' },
    TRUCK: { icon: '🚛', label: 'Yuk mashinasi' },
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

  const initFavs = useFavoritesStore((s) => s.init);
  const favIds = useFavoritesStore((s) => s.ids);
  const toggleFav = useFavoritesStore((s) => s.toggle);
  useEffect(() => { initFavs(); }, [initFavs]);

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
        price: number | string; stock: number;
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
            <div className="hero-banner-art" key={`emoji-${activeSlug}-${bannerIdx}`} style={{ animation: 'bannerFadeIn 500ms ease' }}>
              {slide.emoji}
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
                  <span>🎉</span> Bepul yetkazib berish qo&apos;llanadi!
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
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          letterSpacing: '0.3px',
                        }}>
                          <span style={{ fontSize: 12 }}>{v.icon}</span>
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
                        color: isFav ? '#fff' : '#ef4444',
                        fontSize: 16,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                        zIndex: 1,
                        transition: 'transform 150ms ease, background 150ms ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'}
                    >{isFav ? '♥' : '♡'}</button>

                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
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
                      <div className="product-card-price">{money(product.price)} so&apos;m</div>
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
