import { AdminSidebar } from '@/components/admin/Sidebar';
import { AdminTopbar } from '@/components/admin/Topbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="app-main">
        <AdminTopbar />
        <main className="app-content fade-in">{children}</main>
      </div>
    </div>
  );
}
