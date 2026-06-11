'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { useCartStore } from '@/stores/cart';
import { api, money } from '@/lib/api';

type Profile = {
  name: string;
  phone: string;
  ordersCount?: number;
  totalSpent?: number;
};

const DEMO: Profile = {
  name: 'Foydalanuvchi',
  phone: '',
  ordersCount: 0,
  totalSpent: 0,
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(DEMO);
  const cartClear = useCartStore((s) => s.clear);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { router.replace('/login'); return; }
    const load = async () => {
      try {
        const data = await api<{
          name?: string; fullName?: string;
          phone?: string | null; email?: string | null;
          ordersCount?: number; totalSpent?: number;
        }>('/users/me', { token });
        const normalized: Profile = {
          name: data.name ?? data.fullName ?? data.email ?? 'Foydalanuvchi',
          phone: data.phone ?? data.email ?? '',
          ordersCount: data.ordersCount ?? DEMO.ordersCount,
          totalSpent: data.totalSpent ?? DEMO.totalSpent,
        };
        setProfile(normalized);
      } catch {
        /* keep demo profile */
      }
    };
    load();
  }, [router, token]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    cartClear?.();
    router.replace('/login');
  };

  const initials = (n: string | null | undefined) =>
    (n ?? '').toString().split(' ').filter(Boolean).map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="page" style={{ paddingBottom: 88 }}>
      {/* Header */}
      <div style={{
        background:
          'radial-gradient(circle at 50% 0%, rgba(124,58,237,0.16) 0%, transparent 65%),' +
          'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '48px 20px 28px',
        paddingTop: 'max(48px, calc(env(safe-area-inset-top) + 24px))',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <div className="avatar avatar-lg">
          {initials(profile.name)}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {profile.name}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>{profile.phone}</div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginTop: 8, width: '100%', maxWidth: 360 }}>
          {[
            { label: "Buyurtmalar", value: profile.ordersCount ?? 0 },
            { label: "Xarajatlar", value: `${money(profile.totalSpent ?? 0)} so'm` },
          ].map((s) => (
            <div key={s.label} style={{
              flex: 1,
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              borderRadius: 14,
              border: '1px solid var(--border)',
              padding: '12px 12px',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(124,58,237,0.08)',
            }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>{s.value}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>
        <div className="stack" style={{ gap: 10 }}>

          {/* Quick links */}
          {[
            { label: "Barcha buyurtmalar", sub: 'Faol va o\'tgan buyurtmalar', href: '/orders' },
            { label: "Sevimli mahsulotlar", sub: 'Saqlanganlar ro\'yxati', href: '/favorites' },
            { label: "Saqlangan manzillar", sub: 'Yetkazib berish manzillari', href: '/profile/addresses' },
          ].map((item) => (
            <button
              key={item.label}
              className="menu-row"
              style={{ width: '100%', textAlign: 'left' }}
              onClick={() => router.push(item.href)}
            >
              <div style={{ flex: 1 }}>
                <div className="menu-row-label">{item.label}</div>
                <div className="menu-row-sub">{item.sub}</div>
              </div>
              <span className="menu-row-chevron" style={{ fontSize: 22 }}>›</span>
            </button>
          ))}

          {/* OTP security note */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary-light) 0%, #f5f1ff 100%)',
            borderRadius: 14, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            border: '1px solid #ddd6fe',
            marginTop: 8,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: '#fff', display: 'grid', placeItems: 'center',
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary-dark)' }}>Akkaunt himoyalangan</div>
              <div style={{ fontSize: 12, color: 'var(--primary)' }}>SMS kod va xavfsizlik tekshiruvlari yoqilgan</div>
            </div>
            <span className="badge-pill chip-green">Xavfsiz</span>
          </div>

          {/* App version */}
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>
            Lochin Customer · v1.0.0
          </div>

          {/* Logout */}
          <button
            className="btn btn-full"
            style={{
              marginTop: 8,
              height: 50,
              fontSize: 15,
              background: 'transparent',
              color: 'var(--danger)',
              border: '2px solid var(--danger-light)',
              boxShadow: 'none',
            }}
            onClick={handleLogout}
          >
            Chiqish
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
