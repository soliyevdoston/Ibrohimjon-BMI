'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CourierBottomNav } from '@/components/BottomNav';
import { api } from '@/lib/api';

const VEHICLES = ['Skuter', 'Motosikl', 'Velosiped', 'Mashina', 'Piyoda'];

export default function CourierProfilePage() {
  const router = useRouter();
  const [name, setName] = useState('Jasur Toshmatov');
  const [phone, setPhone] = useState('+998 90 123 45 67');
  const [vehicle, setVehicle] = useState('Skuter');
  const [zone, setZone] = useState('Yunusobod');
  const [rating, setRating] = useState(4.9);
  const [deliveriesToday, setDeliveriesToday] = useState(7);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { router.replace('/login'); return; }
    const load = async () => {
      try {
        const data = await api<{ name: string; phone: string; vehicle?: string; zone?: string; rating?: number; deliveriesToday?: number }>(
          '/courier/profile', { token }
        );
        if (data.name) setName(data.name);
        if (data.phone) setPhone(data.phone);
        if (data.vehicle) setVehicle(data.vehicle);
        if (data.zone) setZone(data.zone);
        if (data.rating) setRating(data.rating);
        if (data.deliveriesToday) setDeliveriesToday(data.deliveriesToday);
      } catch { /* use demo */ }
    };
    load();
  }, [router, token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api('/courier/profile', { method: 'POST', body: { name, vehicle, zone }, token });
    } catch { /* ignore */ } finally {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    router.replace('/login');
  };

  const initials = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'C';

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100dvh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, #1e1b4b 0%, #4f46e5 100%)',
        padding: '48px 20px 28px',
        paddingTop: 'max(48px, calc(env(safe-area-inset-top) + 20px))',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 76, height: 76, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)',
          display: 'grid', placeItems: 'center', fontSize: 30, fontWeight: 800, color: '#fff',
        }}>
          {initials(name)}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>{name}</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{phone}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
          {[
            { label: 'Reyting', value: `${rating.toFixed(1)} ★` },
            { label: 'Bugun', value: `${deliveriesToday} ta` },
            { label: 'Zona', value: zone },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 12,
              padding: '10px 8px', textAlign: 'center', backdropFilter: 'blur(8px)',
            }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Profile info */}
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 16, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Shaxsiy ma'lumotlar</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>To'liq ism</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Telefon</label>
                <input className="input" value={phone} readOnly style={{ opacity: 0.6 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Zona</label>
                <input className="input" value={zone} onChange={e => setZone(e.target.value)} placeholder="Yunusobod" />
              </div>
            </div>
          </div>

          {/* Vehicle */}
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 16, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Transport vositasi</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {VEHICLES.map(v => (
                <button key={v} onClick={() => setVehicle(v)} style={{
                  padding: '8px 14px', borderRadius: 10, border: '2px solid',
                  borderColor: vehicle === v ? 'var(--primary)' : 'var(--border)',
                  background: vehicle === v ? 'var(--primary-50)' : 'var(--surface-2)',
                  color: vehicle === v ? 'var(--primary)' : 'var(--text)',
                  fontWeight: vehicle === v ? 700 : 500, fontSize: 13, cursor: 'pointer',
                  transition: 'all 150ms',
                }}>
                  {v === 'Skuter' ? '🛵' : v === 'Motosikl' ? '🏍' : v === 'Velosiped' ? '🚲' : v === 'Mashina' ? '🚗' : '🚶'} {v}
                </button>
              ))}
            </div>
          </div>

          {/* OTP security */}
          <div style={{
            background: 'var(--surface-2)', borderRadius: 14, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 22 }}>🔐</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>OTP autentifikatsiya</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>SMS kod orqali himoyalangan</div>
            </div>
            <span className="chip green">Xavfsiz</span>
          </div>

          {/* Save button */}
          <button className="btn" onClick={handleSave} disabled={saving} style={{ height: 50, fontSize: 15 }}>
            {saving ? 'Saqlanmoqda…' : saved ? '✓ Saqlandi' : 'Saqlash'}
          </button>

          {/* Logout */}
          <button className="btn danger" onClick={handleLogout} style={{ height: 50, fontSize: 15 }}>
            Chiqish
          </button>
        </div>
      </div>

      <CourierBottomNav />
    </div>
  );
}
