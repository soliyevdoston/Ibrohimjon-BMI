import { PanelNav } from '@/components/PanelNav';

const items = [
  { href: '/customer', icon: '🏠', label: 'Browse' },
  { href: '/customer/checkout', icon: '🛒', label: 'Checkout' },
  { href: '/customer/orders/demo', icon: '📍', label: 'Tracking' },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="panel-layout">
      <PanelNav items={items} />
      <main className="panel-main">{children}</main>
    </div>
  );
}
