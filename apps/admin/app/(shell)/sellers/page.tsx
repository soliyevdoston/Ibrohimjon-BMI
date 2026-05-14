'use client';

import { useMemo, useState } from 'react';
import { IconClose, IconPlus, IconSearch } from '@/components/admin/Icon';
import { initials } from '@/lib/admin-mock';
import {
  useApiSellers,
  createSellerApi,
  setSellerActiveApi,
  deleteSellerApi,
  type ApiSeller,
} from '@/lib/admin-api';

function uzs(value: number) {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' soʼm';
}

export default function AdminSellersPage() {
  const { items: sellers, loading, refetch } = useApiSellers();
  const [q, setQ] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = useMemo(() => {
    return sellers.filter((s) => {
      if (onlyActive && !s.isActive) return false;
      if (q) {
        const needle = q.toLowerCase();
        const haystack = `${s.brandName} ${s.legalName} ${s.user.fullName ?? ''} ${s.user.email ?? ''}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [q, onlyActive, sellers]);

  const activeCount = sellers.filter((s) => s.isActive).length;
  const avgRating = sellers.length
    ? sellers.reduce((sum, s) => sum + Number(s.rating ?? 0), 0) / sellers.length
    : 0;

  const toggleActive = async (s: ApiSeller) => {
    setBusyId(s.id);
    try {
      await setSellerActiveApi(s.id, !s.isActive);
      await refetch();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (s: ApiSeller) => {
    if (!confirm(`${s.brandName} sotuvchisini o'chirishni xohlaysizmi?\nBarcha mahsulotlari nofaol holatga o'tadi.`)) return;
    setBusyId(s.id);
    try {
      await deleteSellerApi(s.id);
      await refetch();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Sotuvchilar</span>
            <span className="kpi-ico indigo">🏬</span>
          </div>
          <div className="kpi-value">{sellers.length}</div>
          <div className="kpi-meta">{activeCount} faol</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">O&apos;rtacha reyting</span>
            <span className="kpi-ico amber">★</span>
          </div>
          <div className="kpi-value">{avgRating.toFixed(1)}</div>
          <div className="kpi-meta">5.0 dan</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Yangi (oxirgi 7 kun)</span>
            <span className="kpi-ico green">📈</span>
          </div>
          <div className="kpi-value">
            {sellers.filter((s) => {
              const days = (Date.now() - new Date(s.createdAt).getTime()) / 86400000;
              return days <= 7;
            }).length}
          </div>
          <div className="kpi-meta">Ro&apos;yxatdan o&apos;tgan</div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Sotuvchilar</h3>
            <div className="card-sub">{loading ? 'yuklanmoqda…' : `${rows.length} ta ko'rsatilmoqda`}</div>
          </div>
          <div className="hstack">
            <label className="hstack" style={{ gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
              Faqat faol
            </label>
            <div className="topbar-search" style={{ margin: 0, minWidth: 220 }}>
              <IconSearch size={15} />
              <input placeholder="Brend, egasi..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <button className="btn" onClick={() => setShowCreate(true)}>
              <IconPlus size={14} /> Sotuvchi qo&apos;shish
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Brend</th>
                <th>Yuridik nomi</th>
                <th>Egasi</th>
                <th>Manzil</th>
                <th>Holat</th>
                <th>Reyting</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="tcell-primary">
                      <span
                        className="avatar"
                        style={{
                          width: 32, height: 32, fontSize: 11,
                          background: 'linear-gradient(135deg, #fde68a, #fca5a5)',
                        }}
                      >
                        {initials(s.brandName)}
                      </span>
                      <div>
                        <strong>{s.brandName}</strong>
                        <div className="muted" style={{ fontSize: 12 }}>{s.user.phone ?? '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{s.legalName}</td>
                  <td>
                    <div style={{ fontSize: 13 }}>{s.user.fullName ?? '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.user.email ?? '—'}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>{s.addressText ?? '—'}</td>
                  <td>
                    <span className={`chip ${s.isActive ? 'green' : 'gray'}`}>
                      {s.isActive ? 'Faol' : "To'xtatilgan"}
                    </span>
                  </td>
                  <td>
                    <span className="hstack" style={{ gap: 4 }}>
                      <span style={{ color: '#f59e0b' }}>★</span>
                      <strong>{Number(s.rating).toFixed(1)}</strong>
                    </span>
                  </td>
                  <td>
                    <div className="hstack" style={{ gap: 4, justifyContent: 'flex-end' }}>
                      <button
                        className={`btn ${s.isActive ? 'ghost' : 'soft'} sm`}
                        onClick={() => toggleActive(s)}
                        disabled={busyId === s.id}
                      >
                        {s.isActive ? "To'xtatish" : 'Faollashtirish'}
                      </button>
                      <button
                        className="icon-btn"
                        style={{ width: 30, height: 30, color: '#ef4444' }}
                        onClick={() => remove(s)}
                        disabled={busyId === s.id}
                        title="O'chirish"
                      >
                        <IconClose size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <div className="empty-ico">∅</div>
                      <strong>{loading ? 'Yuklanmoqda…' : 'Sotuvchilar topilmadi'}</strong>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <CreateSellerModal
          onClose={() => setShowCreate(false)}
          onCreated={async () => {
            setShowCreate(false);
            await refetch();
          }}
        />
      )}

      {uzs(0) ? null : null /* keep uzs imported for future totals row */}
    </div>
  );
}

function CreateSellerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    brandName: '',
    legalName: '',
    phone: '',
    description: '',
    addressText: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!form.phone.trim()) {
      setError('Telefon raqami kerak (sotuvchining login uchun)');
      return;
    }
    if (!form.email.trim() || form.password.length < 6) {
      setError('Email va parol (6+ belgi) kerak');
      return;
    }
    if (!form.brandName.trim() || !form.legalName.trim()) {
      setError('Brend nomi va yuridik nom kerak');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createSellerApi({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim() || undefined,
        brandName: form.brandName.trim(),
        legalName: form.legalName.trim(),
        phone: form.phone.trim() || undefined,
        description: form.description.trim() || undefined,
        addressText: form.addressText.trim() || undefined,
      });
      onCreated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'grid', placeItems: 'center', zIndex: 1000, padding: 16,
      }}
    >
      <div style={{
        background: 'var(--surface)', borderRadius: 16, padding: 24,
        maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700 }}>Yangi sotuvchi qo&apos;shish</h3>
          <button className="icon-btn" onClick={onClose} style={{ width: 28, height: 28 }}>
            <IconClose size={14} />
          </button>
        </div>

        <div className="stack" style={{ gap: 12 }}>
          <div style={{
            background: '#eff6ff', border: '1px solid #bfdbfe',
            color: '#1e40af', padding: '10px 12px', borderRadius: 10,
            fontSize: 12,
          }}>
            <strong>Eslatma:</strong> sotuvchi <strong>telefon raqami + parol</strong> bilan
            tizimga kiradi. Email zaxira/qayta tiklash uchun.
          </div>
          <Field label="Telefon raqami * (login)" placeholder="+998 90 123 45 67" value={form.phone} onChange={set('phone')} type="tel" />
          <Field label="Parol *" placeholder="kamida 6 belgi" value={form.password} onChange={set('password')} type="password" />
          <Field label="Email *" placeholder="brand@lochin.uz" value={form.email} onChange={set('email')} type="email" />
          <Field label="Brend nomi *" placeholder="masalan, Lochin Market" value={form.brandName} onChange={set('brandName')} />
          <Field label="Yuridik nomi *" placeholder="masalan, Lochin Market MChJ" value={form.legalName} onChange={set('legalName')} />
          <Field label="Egasi (FIO)" placeholder="ixtiyoriy" value={form.fullName} onChange={set('fullName')} />
          <Field label="Manzil" placeholder="ixtiyoriy" value={form.addressText} onChange={set('addressText')} />
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Tavsif</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              placeholder="Ixtiyoriy"
              style={{
                width: '100%', marginTop: 4, padding: 10, borderRadius: 10,
                border: '1px solid var(--border)', background: 'var(--surface-2)',
                fontSize: 13, fontFamily: 'inherit', resize: 'vertical',
              }}
            />
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 10, fontSize: 13 }}>
              {error}
            </div>
          )}

          <div className="hstack" style={{ gap: 8, marginTop: 4 }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Bekor</button>
            <button className="btn" style={{ flex: 2 }} onClick={submit} disabled={saving}>
              {saving ? 'Saqlanmoqda…' : "Sotuvchi qo'shish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, placeholder, value, onChange, type = 'text',
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        style={{
          width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 10,
          border: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 13,
        }}
      />
    </div>
  );
}
