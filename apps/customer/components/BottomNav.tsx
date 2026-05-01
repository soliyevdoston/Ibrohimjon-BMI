'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import { CartDrawer } from '@/components/CartDrawer';

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9L12 2l9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.97-1.67L23 6H6" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const isOpen = useCartStore((s) => s.isOpen);
  const setOpen = useCartStore((s) => s.setOpen);
  const items = useCartStore((s) => s.items);
  const accessToken = useAuthStore((s) => s.accessToken);
  const initAuth = useAuthStore((s) => s.init);

  // Avoid hydration mismatch — persisted state only on client
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); initAuth(); }, [initAuth]);

  const cartCount = hydrated ? items.reduce((a, i) => a + i.quantity, 0) : 0;
  const isLoggedIn = !!accessToken;

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      // Redirect to login with redirect back
      window.location.href = `/login?redirect=${pathname}`;
      return;
    }
    setOpen(!isOpen);
  };

  const isCartActive = isOpen;

  return (
    <>
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {/* Home */}
          <Link
            href="/home"
            className={`bottom-nav-item${pathname === '/home' ? ' active' : ''}`}
          >
            <div className="bottom-nav-icon">
              <HomeIcon />
            </div>
            <span>Bosh sahifa</span>
          </Link>

          {/* Orders */}
          <Link
            href="/orders"
            className={`bottom-nav-item${pathname === '/orders' || pathname.startsWith('/orders/') ? ' active' : ''}`}
          >
            <div className="bottom-nav-icon">
              <OrdersIcon />
            </div>
            <span>Buyurtmalar</span>
          </Link>

          {/* Cart — opens drawer */}
          <button
            type="button"
            onClick={handleCartClick}
            className={`bottom-nav-item${isCartActive ? ' active' : ''}`}
            aria-label="Savat"
          >
            <div className="bottom-nav-icon">
              <CartIcon />
              {cartCount > 0 && (
                <span className="bottom-nav-badge">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </div>
            <span>Savat</span>
          </button>

          {/* Profile */}
          <Link
            href="/profile"
            className={`bottom-nav-item${pathname === '/profile' ? ' active' : ''}`}
          >
            <div className="bottom-nav-icon">
              <ProfileIcon />
            </div>
            <span>Profil</span>
          </Link>
        </div>
      </nav>

      {/* Globally render cart drawer so it works on every page */}
      <CartDrawer />
    </>
  );
}
