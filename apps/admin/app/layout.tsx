import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { NavProvider } from '@/components/admin/NavContext';
import { AdminSidebar } from '@/components/admin/Sidebar';
import { AdminTopbar } from '@/components/admin/Topbar';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Lochin · Admin Console',
  description: 'Operations control surface for the delivery platform',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#4f46e5',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}>
        <NavProvider>
          <div className="app-shell">
            <AdminSidebar />
            <div className="app-main">
              <AdminTopbar />
              <main className="app-content fade-in">{children}</main>
            </div>
          </div>
        </NavProvider>
      </body>
    </html>
  );
}
