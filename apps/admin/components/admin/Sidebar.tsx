'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  IconBox,
  IconBuilding,
  IconChart,
  IconClose,
  IconDashboard,
  IconLive,
  IconLogout,
  IconMoney,
  IconOrders,
  IconPackage,
  IconSettings,
  IconStore,
  IconTag,
  IconTruck,
  IconUsers,
} from './Icon';
import { useNav } from './NavContext';
import { useAdminStats } from '@/lib/admin-api';

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; stroke?: number }>;
  badgeKey?: 'activeDeliveries';
};

type Group = { label: string; items: Item[] };

const groups: Group[] = [
  {
    label: 'Overview',
    items: [
      { href: '/',           label: 'Dashboard',       icon: IconDashboard },
      { href: '/live',       label: 'Live deliveries', icon: IconLive, badgeKey: 'activeDeliveries' },
      { href: '/analytics',  label: 'Analytics',       icon: IconChart },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/orders',     label: 'Buyurtmalar', icon: IconOrders },
      { href: '/couriers',   label: 'Kuryerlar',   icon: IconTruck },
      { href: '/sellers',    label: 'Sotuvchilar', icon: IconStore },
      { href: '/users',      label: 'Mijozlar',    icon: IconUsers },
      { href: '/payments',   label: "To'lovlar",   icon: IconMoney },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/products',   label: 'Mahsulotlar',  icon: IconBox },
      { href: '/categories', label: 'Kategoriyalar', icon: IconTag },
    ],
  },
  {
    label: 'Network',
    items: [
      { href: '/branches',   label: 'Filiallar',  icon: IconBuilding },
      { href: '/pickups',    label: 'Punktlar',   icon: IconPackage },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/settings',   label: 'Sozlamalar', icon: IconSettings },
    ],
  },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, close } = useNav();
  const { data: stats } = useAdminStats();
  const [user, setUser] = useState<{ name: string; email: string }>({ name: '', email: '' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setUser({
      name: localStorage.getItem('name') ?? '',
      email: localStorage.getItem('email') ?? '',
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    router.replace('/login');
  };

  return (
    <>
      <aside className={`sidebar${isOpen ? ' is-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">LC</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-brand-name">Lochin</div>
            <div className="sidebar-brand-role">Admin Console</div>
          </div>
          <button
            type="button"
            className="icon-btn only-mobile"
            aria-label="Close menu"
            onClick={close}
            style={{ width: 32, height: 32 }}
          >
            <IconClose size={16} />
          </button>
        </div>

        {groups.map((group) => (
          <div key={group.label}>
            <div className="sidebar-group-label">{group.label}</div>
            <nav style={{ display: 'grid', gap: 2 }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const badgeValue =
                  item.badgeKey === 'activeDeliveries' ? stats?.kpis.activeDeliveries ?? 0 : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link${active ? ' is-active' : ''}`}
                  >
                    <span className="sb-ico">
                      <Icon size={18} />
                    </span>
                    <span>{item.label}</span>
                    {badgeValue > 0 ? <span className="sb-count">{badgeValue}</span> : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}

        <div className="sidebar-footer">
          <div className="avatar">{initials(user.name || user.email || 'Admin')}</div>
          <div className="avatar-label" style={{ minWidth: 0, flex: 1 }}>
            <strong>{user.name || 'Admin'}</strong>
            <span>{user.email || '—'}</span>
          </div>
          <button
            aria-label="Chiqish"
            title="Chiqish"
            className="icon-btn"
            style={{ width: 32, height: 32 }}
            onClick={handleLogout}
          >
            <IconLogout size={16} />
          </button>
        </div>
      </aside>

      <div
        className={`nav-backdrop${isOpen ? ' show' : ''}`}
        onClick={close}
        aria-hidden
      />
    </>
  );
}
