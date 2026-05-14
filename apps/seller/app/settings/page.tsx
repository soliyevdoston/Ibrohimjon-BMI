'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SellerSidebar } from '@/components/Sidebar';
import { SellerTopbar } from '@/components/Topbar';
import { api } from '@/lib/api';

type Profile = {
  name: string;
  phone: string;
  brand: string;
  address: string;
  description: string;
  workingHours: string;
};

const DEMO: Profile = {
  name: '',
  phone: '',
  brand: '',
  address: '',
  description: '',
  workingHours: '',
};

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState<Profile>(DEMO);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notify, setNotify] = useState({ newOrder: true, orderReady: true, lowStock: true, promotions: false });

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { router.replace('/login'); return; }
    const load = async () => {
      try {
        const data = await api<{
          legalName?: string; brandName?: string; description?: string;
          addressText?: string; phone?: string;
        }>('/seller/profile', { token });
        setForm((prev) => ({
          ...prev,
          name: data.legalName ?? prev.name,
          brand: data.brandName ?? prev.brand,
          address: data.addressText ?? prev.address,
          description: data.description ?? prev.description,
          phone: data.phone ?? prev.phone,
        }));
      } catch { /* use demo */ }
    };
    load();
  }, [router, token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api('/seller/profile', {
        method: 'POST',
        body: {
          legalName: form.name,
          brandName: form.brand,
          description: form.description,
          addressText: form.address,
        },
        token,
      });
    } catch { /* ignore */ } finally {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const set = (k: keyof Profile, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="app-shell">
      <SellerSidebar />
      <div className="app-main">
        <SellerTopbar title="Sozlamalar" subtitle="Hisob va sozlamalar" />
        <main className="app-content fade-in">
          <div className="stack">

            {/* Store profile */}
            <div className="card">
              <div className="card-h">
                <div>
                  <h3>Do'kon profili</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Mijozlarga ko'rinadi</div>
                </div>
              </div>
              <div className="grid-2" style={{ gap: 16 }}>
                <div>
                  <label className="label">Do'kon / brend nomi</label>
                  <input className="input" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
                </div>
                <div>
                  <label className="label">Egasining to'liq ismi</label>
                  <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
                </div>
                <div>
                  <label className="label">Telefon raqami</label>
                  <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} readOnly style={{ opacity: 0.6 }} />
                </div>
                <div>
                  <label className="label">Ish vaqti</label>
                  <input className="input" value={form.workingHours} onChange={(e) => set('workingHours', e.target.value)} placeholder="09:00 – 22:00" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Manzil</label>
                  <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Do'kon tavsifi</label>
                  <textarea
                    className="input"
                    rows={3}
                    style={{ resize: 'vertical' }}
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="card">
              <div className="card-h">
                <div>
                  <h3>Bildirishnomalar</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Qanday bildirishnomalar olishni tanlang</div>
                </div>
              </div>
              <div className="stack" style={{ gap: 14 }}>
                {([
                  { key: 'newOrder',    label: 'Yangi buyurtma keldi',          hint: 'Mijoz buyurtma berganda xabar beradi' },
                  { key: 'orderReady', label: 'Kuryer buyurtmani oldi',         hint: 'Kuryer buyurtmangizni olganda xabar beradi' },
                  { key: 'lowStock',   label: 'Zaxira kam qoldi',               hint: 'Mahsulot zaxirasi 10 tadan kam bo\'lganda' },
                  { key: 'promotions', label: 'Platforma aksiyalari',            hint: 'Lochin kampaniyalari va chegirmalari' },
                ] as const).map((n) => (
                  <label key={n.key} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                    <div style={{
                      width: 44, height: 26, borderRadius: 999,
                      background: notify[n.key] ? 'var(--primary)' : 'var(--surface-2)',
                      position: 'relative', transition: 'background 200ms', flexShrink: 0,
                      border: '1px solid var(--border)',
                    }}
                      onClick={() => setNotify((p) => ({ ...p, [n.key]: !p[n.key] }))}
                    >
                      <div style={{
                        position: 'absolute', top: 3,
                        left: notify[n.key] ? 20 : 3,
                        width: 18, height: 18, borderRadius: 999,
                        background: '#fff', transition: 'left 200ms',
                        boxShadow: '0 1px 4px rgba(0,0,0,.2)',
                      }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{n.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{n.hint}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Change password */}
            <PasswordCard />


            {/* Danger zone */}
            <div className="card" style={{ border: '1px solid rgba(239,68,68,.3)' }}>
              <div className="card-h">
                <div>
                  <h3 style={{ color: 'var(--danger)' }}>Xavfli zona</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Qaytarib bo'lmaydigan amallar</div>
                </div>
              </div>
              <div className="hstack" style={{ justifyContent: 'space-between', padding: '10px 0' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Do'konni o'chirish</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>O'chirilgan paytda mijozlar buyurtma bera olmaydi</div>
                </div>
                <button className="btn danger sm" onClick={() => alert("Do'konni o'chirish uchun qo'llab-quvvatlash xizmatiga murojaat qiling.")}>
                  O'chirish
                </button>
              </div>
            </div>

            {/* Save bar */}
            <div className="hstack" style={{ justifyContent: 'flex-end', gap: 10, paddingBottom: 32 }}>
              <button className="btn ghost" onClick={() => setForm(DEMO)}>Bekor qilish</button>
              <button className="btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saqlanmoqda…' : saved ? '✓ Saqlandi' : "O'zgarishlarni saqlash"}
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

function PasswordCard() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const submit = async () => {
    setMsg(null);
    if (current.length < 6 || next.length < 6) {
      setMsg({ kind: 'err', text: 'Parollar kamida 6 belgi bo\'lishi kerak' });
      return;
    }
    if (next !== confirm) {
      setMsg({ kind: 'err', text: 'Yangi parollar mos kelmadi' });
      return;
    }
    setSaving(true);
    try {
      await api('/auth/password', {
        method: 'PATCH',
        body: { currentPassword: current, newPassword: next },
      });
      setMsg({ kind: 'ok', text: 'Parol yangilandi' });
      setCurrent(''); setNext(''); setConfirm('');
    } catch (e) {
      setMsg({ kind: 'err', text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Parolni o&apos;zgartirish</h3>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Admin bergan boshlang&apos;ich parolni xavfsizroq parol bilan almashtiring
          </div>
        </div>
      </div>
      <div className="stack-sm">
        <label className="label">Joriy parol</label>
        <input
          className="input"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
        />
        <label className="label" style={{ marginTop: 6 }}>Yangi parol</label>
        <input
          className="input"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="Kamida 6 belgi"
          autoComplete="new-password"
        />
        <label className="label" style={{ marginTop: 6 }}>Yangi parolni tasdiqlang</label>
        <input
          className="input"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
        {msg && (
          <div style={{
            fontSize: 13, marginTop: 6,
            color: msg.kind === 'ok' ? '#065f46' : '#991b1b',
          }}>
            {msg.text}
          </div>
        )}
        <button
          className="btn"
          onClick={submit}
          disabled={saving}
          style={{ marginTop: 8, alignSelf: 'flex-start' }}
        >
          {saving ? 'Yangilanmoqda…' : 'Parolni o\'zgartirish'}
        </button>
      </div>
    </div>
  );
}
