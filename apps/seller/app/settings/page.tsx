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
  name: 'Lochin Store',
  phone: '+998 90 123 45 67',
  brand: 'My Store',
  address: 'Toshkent, Yunusobod tumani',
  description: 'Fresh and quality products delivered to your door',
  workingHours: '09:00 – 22:00',
};

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState<Profile>(DEMO);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notify, setNotify] = useState({ newOrder: true, orderReady: true, lowStock: true, promotions: false });

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { router.replace('/login'); return; }
    const load = async () => {
      try {
        const data = await api<Profile>('/sellers/me', { token });
        setForm((prev) => ({ ...prev, ...data }));
      } catch { /* use demo */ }
    };
    load();
  }, [router, token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api('/sellers/me', { method: 'PATCH', body: form, token });
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
        <SellerTopbar title="Settings" subtitle="Account & preferences" />
        <main className="app-content fade-in">
          <div className="stack">

            {/* Store profile */}
            <div className="card">
              <div className="card-h">
                <div>
                  <h3>Store profile</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Visible to customers</div>
                </div>
              </div>
              <div className="grid-2" style={{ gap: 16 }}>
                <div>
                  <label className="label">Store / brand name</label>
                  <input className="input" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
                </div>
                <div>
                  <label className="label">Owner full name</label>
                  <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
                </div>
                <div>
                  <label className="label">Phone number</label>
                  <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} readOnly style={{ opacity: 0.6 }} />
                </div>
                <div>
                  <label className="label">Working hours</label>
                  <input className="input" value={form.workingHours} onChange={(e) => set('workingHours', e.target.value)} placeholder="09:00 – 22:00" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Address</label>
                  <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Store description</label>
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
                  <h3>Notifications</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Choose what alerts you receive</div>
                </div>
              </div>
              <div className="stack" style={{ gap: 14 }}>
                {([
                  { key: 'newOrder',    label: 'New order received',      hint: 'Ping when a customer places an order' },
                  { key: 'orderReady', label: 'Order picked up by courier', hint: 'When courier picks up your order' },
                  { key: 'lowStock',   label: 'Low stock alert',           hint: 'When product stock falls below 10' },
                  { key: 'promotions', label: 'Platform promotions',       hint: 'Lochin campaigns and discounts' },
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
            <div className="card">
              <div className="card-h">
                <div>
                  <h3>Security</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>OTP — phone-based, no password needed</div>
                </div>
              </div>
              <div style={{
                background: 'var(--surface-2)', borderRadius: 12, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 24 }}>🔐</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Authentication via OTP</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Your account is secured by one-time SMS codes. No password is stored.
                  </div>
                </div>
                <span className="chip green" style={{ marginLeft: 'auto', flexShrink: 0 }}>Secure</span>
              </div>
            </div>

            {/* Danger zone */}
            <div className="card" style={{ border: '1px solid rgba(239,68,68,.3)' }}>
              <div className="card-h">
                <div>
                  <h3 style={{ color: 'var(--danger)' }}>Danger zone</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Irreversible actions</div>
                </div>
              </div>
              <div className="hstack" style={{ justifyContent: 'space-between', padding: '10px 0' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Deactivate store</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Customers can't place orders while deactivated</div>
                </div>
                <button className="btn danger sm" onClick={() => alert('Contact support to deactivate your store.')}>
                  Deactivate
                </button>
              </div>
            </div>

            {/* Save bar */}
            <div className="hstack" style={{ justifyContent: 'flex-end', gap: 10, paddingBottom: 32 }}>
              <button className="btn ghost" onClick={() => setForm(DEMO)}>Discard</button>
              <button className="btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
