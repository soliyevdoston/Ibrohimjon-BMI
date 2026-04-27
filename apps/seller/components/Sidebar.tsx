'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useEffect } from 'react';
import { IconChart, IconBox, IconCart, IconTrendUp, IconCard, IconSettings } from './Icons';

type IconCmp = React.ComponentType<{ size?: number; stroke?: number }>;

const NAV: { href: string; label: string; Icon: IconCmp; badge?: boolean }[] = [
  { href: '/dashboard', label: 'Dashboard', Icon: IconChart },
  { href: '/products', label: 'Products', Icon: IconBox },
  { href: '/orders', label: 'Orders', Icon: IconCart, badge: true },
  { href: '/analytics', label: 'Tahlil', Icon: IconTrendUp },
  { href: '/payouts', label: "To'lovlar", Icon: IconCard },
  { href: '/settings', label: 'Settings', Icon: IconSettings },
];

export function SellerSidebar({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const { clear, name, init } = useAuthStore();

  useEffect(() => { init(); }, [init]);

  const handleLogout = () => {
    clear();
    router.replace('/login');
  };

  const initials = (n: string) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'S';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">L</div>
        <div>
          <div className="sidebar-brand-name">Lochin</div>
          <div className="sidebar-brand-role">Seller Panel</div>
        </div>
      </div>

      <div className="sidebar-group-label">Navigation</div>

      {NAV.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.Icon;
        return (
          <Link key={item.href} href={item.href} className={`sidebar-link ${isActive ? 'is-active' : ''}`}>
            <span className="sb-ico"><Icon size={18} stroke={1.7} /></span>
            <span>{item.label}</span>
            {item.badge && pendingCount > 0 && (
              <span className="sb-count">{pendingCount}</span>
            )}
          </Link>
        );
      })}

      <div className="sidebar-footer">
        <div className="avatar">{initials(name ?? 'Seller')}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ fontSize: 13, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name || 'My Store'}
          </strong>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Seller</span>
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 16, padding: 4,
          }}
        >
          ↗
        </button>
      </div>
    </aside>
  );
}
