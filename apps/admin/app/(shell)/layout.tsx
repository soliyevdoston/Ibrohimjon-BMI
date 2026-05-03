'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NavProvider } from '@/components/admin/NavContext';
import { AdminSidebar } from '@/components/admin/Sidebar';
import { AdminTopbar } from '@/components/admin/Topbar';

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'ADMIN') {
      router.replace('/login');
    }
  }, [router]);

  return (
    <NavProvider>
      <div className="app-shell">
        <AdminSidebar />
        <div className="app-main">
          <AdminTopbar />
          <main className="app-content fade-in">{children}</main>
        </div>
      </div>
    </NavProvider>
  );
}
