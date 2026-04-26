'use client';

export function SellerTopbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        {subtitle && <div className="topbar-crumb">{subtitle}</div>}
        <div className="topbar-h1">{title}</div>
      </div>
    </header>
  );
}
