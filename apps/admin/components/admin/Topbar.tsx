'use client';

import { usePathname } from 'next/navigation';
import { IconBell, IconMenu, IconSearch } from './Icon';
import { useNav } from './NavContext';

const routeMeta: Record<string, { title: string; crumb: string }> = {
  '/':          { title: 'Dashboard',       crumb: 'Admin / Overview' },
  '/live':      { title: 'Live deliveries', crumb: 'Admin / Overview' },
  '/analytics': { title: 'Analytics',       crumb: 'Admin / Overview' },
  '/orders':    { title: 'Orders',          crumb: 'Admin / Operations' },
  '/couriers':  { title: 'Couriers',        crumb: 'Admin / Operations' },
  '/sellers':   { title: 'Sellers',         crumb: 'Admin / Operations' },
  '/users':     { title: 'Customers',       crumb: 'Admin / Operations' },
  '/settings':  { title: 'Settings',        crumb: 'Admin / System' },
};

export function AdminTopbar() {
  const pathname = usePathname();
  const meta = routeMeta[pathname] || { title: 'Admin', crumb: 'Admin' };
  const { open } = useNav();

  return (
    <header className="topbar">
      <button
        type="button"
        className="mobile-menu-btn"
        aria-label="Open menu"
        onClick={open}
      >
        <IconMenu size={18} />
      </button>

      <div className="topbar-title">
        <span className="topbar-crumb">{meta.crumb}</span>
        <span className="topbar-h1">{meta.title}</span>
      </div>

      <div className="topbar-search">
        <IconSearch size={16} />
        <input placeholder="Search orders, customers, couriers..." />
        <span className="kbd">⌘K</span>
      </div>

      <div className="topbar-actions">
        <button className="icon-btn" aria-label="Notifications">
          <IconBell size={16} />
          <span className="dot" />
        </button>
        <div className="avatar only-desktop" title="Admin User">AD</div>
      </div>
    </header>
  );
}
