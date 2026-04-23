import { PanelNav } from '@/components/PanelNav';

const items = [
  { href: '/seller', icon: '📊', label: 'Dashboard' },
  { href: '/seller/products', icon: '📦', label: 'Products' },
  { href: '/seller/orders', icon: '🧾', label: 'Orders' },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="panel-layout">
      <PanelNav items={items} />
      <main className="panel-main">{children}</main>
    </div>
  );
}
