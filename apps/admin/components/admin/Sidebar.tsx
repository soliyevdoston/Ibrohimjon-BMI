'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconChart,
  IconDashboard,
  IconLive,
  IconLogout,
  IconOrders,
  IconSettings,
  IconStore,
  IconTruck,
  IconUsers,
} from './Icon';

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
      { href: '/orders',     label: 'Orders',    icon: IconOrders },
      { href: '/couriers',   label: 'Couriers',  icon: IconTruck },
      { href: '/sellers',    label: 'Sellers',   icon: IconStore },
      { href: '/users',      label: 'Customers', icon: IconUsers },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/settings',   label: 'Settings',  icon: IconSettings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">IB</div>
        <div>
          <div className="sidebar-brand-name">Ibrohimjon BMI</div>
          <div className="sidebar-brand-role">Admin Console</div>
        </div>
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
          <span>admin@ibrohimjon.uz</span>
        </div>
        <button
          aria-label="Sign out"
          title="Sign out"
          className="icon-btn"
          style={{ width: 32, height: 32 }}
        >
          <IconLogout size={16} />
        </button>
      </div>
    </aside>
  );
}
