'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CourierBottomNav } from '@/components/BottomNav';
import { IconScooter, IconMotorcycle, IconBike, IconCar, IconWalk, IconLock, IconShield, IconLogout, IconCheck } from '@/components/Icons';
import { api } from '@/lib/api';

const VEHICLES: { id: string; label: string; Icon: React.ComponentType<{ size?: number; stroke?: number }> }[] = [
  { id: 'Skuter', label: 'Skuter', Icon: IconScooter },
  { id: 'Motosikl', label: 'Motosikl', Icon: IconMotorcycle },
  { id: 'Velosiped', label: 'Velosiped', Icon: IconBike },
  { id: 'Mashina', label: 'Mashina', Icon: IconCar },
  { id: 'Piyoda', label: 'Piyoda', Icon: IconWalk },
];

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
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '32px 20px 22px',
        paddingTop: 'max(32px, calc(env(safe-area-inset-top) + 16px))',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--surface-2)', border: '1.5px solid var(--border)',
          display: 'grid', placeItems: 'center', fontSize: 26, fontWeight: 800, color: 'var(--text)',
          letterSpacing: '-0.5px',
        }}>
          {initials(name)}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text)', fontSize: 19, fontWeight: 800, letterSpacing: '-0.3px' }}>{name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{phone}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 340, marginTop: 4 }}>
          {[
            { label: 'Reyting', value: rating.toFixed(1) },
            { label: 'Bugun', value: `${deliveriesToday} ta` },
            { label: 'Zona', value: zone },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: 'var(--surface-2)', borderRadius: 10,
              padding: '10px 8px', textAlign: 'center', border: '1px solid var(--border)',
            }}>
              <div style={{ color: 'var(--text)', fontWeight: 800, fontSize: 15 }}>{s.value}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
              {VEHICLES.map(({ id, label, Icon }) => (
                <button key={id} onClick={() => setVehicle(id)} style={{
                  padding: '14px 8px', borderRadius: 12, border: '1.5px solid',
                  borderColor: vehicle === id ? 'var(--text)' : 'var(--border)',
                  background: vehicle === id ? 'var(--text)' : 'var(--surface-2)',
                  color: vehicle === id ? 'var(--surface)' : 'var(--text-muted)',
                  fontWeight: vehicle === id ? 600 : 500, fontSize: 12, cursor: 'pointer',
                  transition: 'all 150ms',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                  <Icon size={26} stroke={1.5} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* OTP security */}
          <div style={{
            background: 'var(--surface-2)', borderRadius: 14, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'grid', placeItems: 'center', color: 'var(--text)',
            }}>
              <IconLock size={18} stroke={1.6} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>OTP autentifikatsiya</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>SMS kod orqali himoyalangan</div>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
              padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)',
            }}>
              <IconShield size={12} stroke={1.8} /> Xavfsiz
            </div>
          </div>

          {/* Save button */}
          <button className="btn" onClick={handleSave} disabled={saving} style={{ height: 50, fontSize: 15, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {saving ? 'Saqlanmoqda…' : saved ? <><IconCheck size={18} stroke={2.2} /> Saqlandi</> : 'Saqlash'}
          </button>

          {/* Logout */}
          <button className="btn danger" onClick={handleLogout} style={{ height: 50, fontSize: 15, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <IconLogout size={18} stroke={1.8} /> Chiqish
          </button>
        </div>
      </div>

      <CourierBottomNav />
    </div>
  );
}
