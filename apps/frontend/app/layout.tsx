import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Delivery Platform',
  description: 'Mini Uzum/Yandex/Uber style delivery platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
