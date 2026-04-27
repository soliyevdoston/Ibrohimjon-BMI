'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/stores/cart';

type NavItem = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
};

function HomeIcon({ active }: { active: boolean }) {
  const color = active ? '#4f46e5' : '#94a3b8';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9L12 2l9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}


function OrdersIcon({ active }: { active: boolean }) {
  const color = active ? '#4f46e5' : '#94a3b8';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function BellIcon({ active }: { active: boolean }) {
  const color = active ? '#4f46e5' : '#94a3b8';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const color = active ? '#4f46e5' : '#94a3b8';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/home',
    label: 'Bosh sahifa',
    icon: (active) => <HomeIcon active={active} />,
  },
  {
    href: '/orders',
    label: 'Buyurtmalar',
    icon: (active) => <OrdersIcon active={active} />,
  },
  {
    href: '/notifications',
    label: 'Xabarlar',
    icon: (active) => <BellIcon active={active} />,
  },
  {
    href: '/profile',
    label: 'Profil',
    icon: (active) => <ProfileIcon active={active} />,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.count());

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {NAV_ITEMS.map((item) => {
          const basePath = item.href.split('?')[0];
          const isActive =
            pathname === basePath ||
            (basePath !== '/home' && pathname.startsWith(basePath + '/'));
          const showBadge = item.href === '/orders' && cartCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`bottom-nav-item${isActive ? ' active' : ''}`}
            >
              <div className="bottom-nav-icon">
                {item.icon(isActive)}
                {showBadge && (
                  <span className="bottom-nav-badge">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
