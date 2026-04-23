import { PanelNav } from '@/components/PanelNav';

const items = [
  { href: '/courier', icon: '🚚', label: 'Courier' },
];

export default function CourierLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="panel-layout">
      <PanelNav items={items} />
      <main className="panel-main">{children}</main>
    </div>
  );
}
