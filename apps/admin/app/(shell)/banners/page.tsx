'use client';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { IconClose, IconPlus } from '@/components/admin/Icon';
import { api } from '@/lib/api';

type Banner = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  position: number;
  isActive: boolean;
  createdAt: string;
};

export default function AdminBannersPage() {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api<Banner[]>('/admin/banners'));
    } catch { setItems([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (b: Banner) => {
    try {
      await api(`/admin/banners/${b.id}`, { method: 'PATCH', body: { isActive: !b.isActive } });
      await load();
    } catch (e) { alert((e as Error).message); }
  };

  const remove = async (b: Banner) => {
    if (!confirm(`"${b.title}" bannerini o'chirasizmi?`)) return;
    try {
      await api(`/admin/banners/${b.id}`, { method: 'DELETE' });
      await load();
    } catch (e) { alert((e as Error).message); }
  };

  return (
    <div className="stack">
      <div className="card">
        <div className="card-h">
          <div>
            <h3>Bannerlar</h3>
            <div className="card-sub">
              {loading ? 'yuklanmoqda…' : `${items.length} ta banner · ${items.filter((b) => b.isActive).length} faol`}
            </div>
          </div>
          <button className="btn" onClick={() => setShowCreate(true)}>
            <IconPlus size={14} /> Banner qo&apos;shish
          </button>
        </div>

        {items.length === 0 && !loading ? (
          <div className="empty">
            <div className="empty-ico">🖼</div>
            <strong>Bannerlar yo&apos;q</strong>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
              Customer bosh sahifasida ko&apos;rinadigan reklamalarni shu yerdan qo&apos;shing.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {items.map((b) => (
              <div
                key={b.id}
                style={{
                  border: '1px solid var(--border)', borderRadius: 14,
                  overflow: 'hidden', background: 'var(--surface)',
                  opacity: b.isActive ? 1 : 0.55,
                }}
              >
                <div style={{ aspectRatio: '21 / 9', background: '#f1f5f9', position: 'relative' }}>
                  {b.imageUrl && (
                    <Image src={b.imageUrl} alt={b.title} fill style={{ objectFit: 'cover' }} unoptimized />
                  )}
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: 14 }}>{b.title}</strong>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.linkUrl ?? 'havolasiz'}
                      </div>
                    </div>
                    <span className={`chip ${b.isActive ? 'green' : 'gray'}`} style={{ flexShrink: 0 }}>
                      {b.isActive ? 'Faol' : 'Nofaol'}
                    </span>
                  </div>
                  <div className="hstack" style={{ gap: 6, marginTop: 10 }}>
                    <button className="btn ghost sm" onClick={() => toggleActive(b)}>
                      {b.isActive ? "To'xtatish" : 'Yoqish'}
                    </button>
                    <button className="btn ghost sm" onClick={() => setEditing(b)}>Tahrirlash</button>
                    <button
                      className="icon-btn"
                      style={{ width: 28, height: 28, color: '#ef4444', marginLeft: 'auto' }}
                      onClick={() => remove(b)}
                      title="O'chirish"
                    >
                      <IconClose size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(showCreate || editing) && (
        <BannerModal
          initial={editing}
          onClose={() => { setShowCreate(false); setEditing(null); }}
          onSaved={async () => { setShowCreate(false); setEditing(null); await load(); }}
        />
      )}
    </div>
  );
}

function BannerModal({
  initial, onClose, onSaved,
}: {
  initial: Banner | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl ?? '');
  const [position, setPosition] = useState(initial?.position ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!title.trim() || !imageUrl.trim()) {
      setError('Sarlavha va rasm URL kerak');
      return;
    }
    setSaving(true); setError('');
    try {
      if (initial) {
        await api(`/admin/banners/${initial.id}`, {
          method: 'PATCH',
          body: { title, imageUrl, linkUrl: linkUrl || null, position, isActive },
        });
      } else {
        await api('/admin/banners', {
          method: 'POST',
          body: { title, imageUrl, linkUrl: linkUrl || undefined, position, isActive },
        });
      }
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally { setSaving(false); }
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
        background: 'var(--surface)', borderRadius: 16, padding: 22,
        maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>
            {initial ? 'Bannerni tahrirlash' : 'Yangi banner'}
          </h3>
          <button className="icon-btn" onClick={onClose} style={{ width: 28, height: 28 }}>
            <IconClose size={14} />
          </button>
        </div>

        <div className="stack" style={{ gap: 12 }}>
          <Field label="Sarlavha *" value={title} onChange={setTitle} placeholder="Yozgi chegirma 50% gacha" />
          <Field label="Rasm URL *" value={imageUrl} onChange={setImageUrl} placeholder="https://…" />
          <Field label="Bosilganda boriladigan havola" value={linkUrl} onChange={setLinkUrl} placeholder="/products/abc" />
          <Field label="Pozitsiya (kichikroq oldinroq)" value={String(position)} onChange={(v) => setPosition(Number(v) || 0)} type="number" />

          <label className="hstack" style={{ gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Faol
          </label>

          {imageUrl && (
            <div style={{ aspectRatio: '21 / 9', background: `url(${imageUrl}) center/cover no-repeat`, borderRadius: 10, border: '1px solid var(--border)' }} />
          )}

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 10, fontSize: 13 }}>
              {error}
            </div>
          )}

          <div className="hstack" style={{ gap: 8 }}>
            <button className="btn ghost" onClick={onClose} disabled={saving} style={{ flex: 1 }}>Bekor</button>
            <button className="btn" onClick={submit} disabled={saving} style={{ flex: 2 }}>
              {saving ? 'Saqlanmoqda…' : 'Saqlash'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
