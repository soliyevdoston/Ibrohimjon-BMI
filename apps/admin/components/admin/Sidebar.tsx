'use client';

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

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; stroke?: number }>;
  badge?: string;
};

type Group = { label: string; items: Item[] };

const groups: Group[] = [
  {
    label: 'Overview',
    items: [
      { href: '/',           label: 'Dashboard',       icon: IconDashboard },
      { href: '/live',       label: 'Live deliveries', icon: IconLive, badge: '12' },
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

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, close } = useNav();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
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
                    {item.badge ? <span className="sb-count">{item.badge}</span> : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}

        <div className="sidebar-footer">
          <div className="avatar">AD</div>
          <div className="avatar-label" style={{ minWidth: 0, flex: 1 }}>
            <strong>Admin User</strong>
            <span>admin@lochin.uz</span>
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
