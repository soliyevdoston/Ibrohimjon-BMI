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
  phone: '+998 90 000 00 00',
  ordersCount: 12,
  totalSpent: 1_450_000,
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(DEMO);
  const [editName, setEditName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const cartClear = useCartStore((s) => s.clear);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { router.replace('/login'); return; }
    const load = async () => {
      try {
        const data = await api<Profile>('/users/me', { token });
        setProfile(data);
        setEditName(data.name);
      } catch {
        setEditName(DEMO.name);
      }
    };
    load();
  }, [router, token]);

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await api('/users/me', { method: 'PATCH', body: { name: editName }, token });
      setProfile((p) => ({ ...p, name: editName }));
    } catch { /* ignore */ } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    cartClear?.();
    router.replace('/login');
  };

  const initials = (n: string) =>
    n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="page" style={{ paddingBottom: 88 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, #1e1b4b 0%, #4f46e5 100%)',
        padding: '48px 20px 28px',
        paddingTop: 'max(48px, calc(env(safe-area-inset-top) + 24px))',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(255,255,255,0.18)', border: '3px solid rgba(255,255,255,0.4)',
          display: 'grid', placeItems: 'center',
          fontSize: 28, fontWeight: 800, color: '#fff',
        }}>
          {initials(profile.name)}
        </div>
        {editing ? (
          <div className="hstack" style={{ gap: 8 }}>
            <input
              className="input"
              style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', maxWidth: 200 }}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            />
            <button
              className="btn"
              style={{ background: '#fff', color: '#4f46e5', height: 40 }}
              onClick={handleSaveName}
              disabled={saving}
            >
              {saving ? '…' : '✓'}
            </button>
            <button
              className="btn ghost"
              style={{ color: '#fff', border: '1px solid rgba(255,255,255,.3)', height: 40 }}
              onClick={() => { setEditing(false); setEditName(profile.name); }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{ color: '#fff', fontSize: 20, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => setEditing(true)}
            >
              {profile.name}
              <span style={{ fontSize: 14, opacity: 0.6 }}>✏️</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginTop: 2 }}>{profile.phone}</div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, marginTop: 4, width: '100%', maxWidth: 360 }}>
          {[
            { label: "Buyurtmalar", value: profile.ordersCount ?? 0 },
            { label: "Xarajatlar", value: `${money(profile.totalSpent ?? 0)} so'm` },
          ].map((s) => (
            <div key={s.label} style={{
              flex: 1, background: 'rgba(255,255,255,0.12)', borderRadius: 12,
              padding: '10px 12px', textAlign: 'center', backdropFilter: 'blur(8px)',
            }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>
        <div className="stack" style={{ gap: 10 }}>

          {/* Quick links */}
          {[
            { icon: '📋', label: "Barcha buyurtmalar", href: '/orders' },
            { icon: '📍', label: "Saqlangan manzillar", href: '/orders' },
          ].map((item) => (
            <button
              key={item.label}
              className="card"
              style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left', width: '100%', border: '1px solid var(--border)' }}
              onClick={() => router.push(item.href)}
            >
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>{item.label}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>›</span>
            </button>
          ))}

          {/* OTP security note */}
          <div style={{
            background: 'var(--surface-2)', borderRadius: 14, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 22 }}>🔐</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>OTP autentifikatsiya</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Akkaunt SMS kod orqali himoyalangan</div>
            </div>
            <span className="chip green">Xavfsiz</span>
          </div>

          {/* App version */}
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>
            Lochin Customer · v1.0.0
          </div>

          {/* Logout */}
          <button
            className="btn danger full"
            style={{ marginTop: 8, height: 50, fontSize: 15 }}
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
