'use client';

import { usePathname } from 'next/navigation';
import { IconBell, IconSearch } from './Icon';

const routeMeta: Record<string, { title: string; crumb: string }> = {
  '/admin':            { title: 'Dashboard',       crumb: 'Admin / Overview' },
  '/admin/live':       { title: 'Live deliveries', crumb: 'Admin / Overview' },
  '/admin/analytics':  { title: 'Analytics',       crumb: 'Admin / Overview' },
  '/admin/orders':     { title: 'Orders',          crumb: 'Admin / Operations' },
  '/admin/couriers':   { title: 'Couriers',        crumb: 'Admin / Operations' },
  '/admin/sellers':    { title: 'Sellers',         crumb: 'Admin / Operations' },
  '/admin/users':      { title: 'Customers',       crumb: 'Admin / Operations' },
  '/admin/settings':   { title: 'Settings',        crumb: 'Admin / System' },
};

export function AdminTopbar() {
  const pathname = usePathname();
  const meta = routeMeta[pathname] || { title: 'Admin', crumb: 'Admin' };

  return (
    <header className="topbar">
      <div className="topbar-title">
        <span className="topbar-crumb">{meta.crumb}</span>
        <span className="topbar-h1">{meta.title}</span>
      </div>

      <div className="topbar-search">
        <IconSearch size={16} />
        <input placeholder="Search orders, users, couriers..." />
      </div>

      <div className="topbar-actions">
        <button className="icon-btn" aria-label="Notifications">
          <IconBell size={16} />
          <span className="dot" />
        </button>
        <div className="avatar" title="Admin User">AD</div>
      </div>
    </header>
  );
}
