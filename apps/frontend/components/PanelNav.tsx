'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export function PanelNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="panel-nav">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            title={item.label}
            style={{
              background: active ? '#daf4fa' : undefined,
              color: active ? '#0b4a59' : undefined,
              fontWeight: active ? 700 : 500,
            }}
          >
            <span>{item.icon}</span>
          </Link>
        );
      })}
    </nav>
  );
}
