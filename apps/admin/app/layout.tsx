import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AdminSidebar } from '@/components/admin/Sidebar';
import { AdminTopbar } from '@/components/admin/Topbar';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Ibrohimjon BMI · Admin Console',
  description: 'Operations control surface for the delivery platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}>
        <div className="app-shell">
          <AdminSidebar />
          <div className="app-main">
            <AdminTopbar />
            <main className="app-content fade-in">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
