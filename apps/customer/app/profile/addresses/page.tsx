'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { BottomNav } from '@/components/BottomNav';
import { api, reverseGeocode } from '@/lib/api';

type Address = {
  id: string;
  label: string;
  addressText: string;
  lat: string | number;
  lng: string | number;
  isDefault: boolean;
};

const LocationPickerMap = dynamic(
  () => import('@/components/map/LocationPickerMap'),
  { ssr: false, loading: () => <div style={{ height: 280, background: 'var(--surface-2)', borderRadius: 12 }} /> },
);

export default function AddressesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Address | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api<Address[]>('/addresses'));
    } catch { setItems([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      router.replace('/login?redirect=/profile/addresses');
      return;
    }
    load();
  }, [router, load]);

  const setDefault = async (id: string) => {
    try {
      await api(`/addresses/${id}`, { method: 'PATCH', body: { isDefault: true } });
      await load();
    } catch {/* ignore */}
  };

  const remove = async (id: string) => {
    if (!confirm("Bu manzilni o'chirasizmi?")) return;
    try {
      await api(`/addresses/${id}`, { method: 'DELETE' });
      await load();
    } catch {/* ignore */}
  };

  return (
    <div className="page" style={{ paddingBottom: 88 }}>
      <div style={{ padding: '32px 20px 16px', paddingTop: 'max(32px, calc(env(safe-area-inset-top) + 16px))' }}>
        <div className="hstack" style={{ justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>Manzillarim</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              {loading ? 'Yuklanmoqda…' : `${items.length} ta manzil`}
            </p>
          </div>
          <button
            className="btn"
            onClick={() => setAdding(true)}
            style={{ padding: '8px 14px', fontSize: 13 }}
          >
            + Yangi manzil
          </button>
        </div>
      </div>

      {items.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📍</div>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Manzillar yo&apos;q</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            Tezroq buyurtma berish uchun manzilingizni saqlang
          </div>
        </div>
      )}

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((a) => (
          <div
            key={a.id}
            style={{
              background: 'var(--surface)',
              border: a.isDefault ? '2px solid var(--primary)' : '1px solid var(--border)',
              borderRadius: 14, padding: '14px 16px',
            }}
          >
            <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="hstack" style={{ gap: 8, marginBottom: 4 }}>
                  <strong style={{ fontSize: 14 }}>{a.label}</strong>
                  {a.isDefault && <span className="chip green" style={{ fontSize: 10 }}>Asosiy</span>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{a.addressText}</div>
              </div>
            </div>
            <div className="hstack" style={{ gap: 6, marginTop: 10 }}>
              {!a.isDefault && (
                <button onClick={() => setDefault(a.id)} style={{
                  fontSize: 12, padding: '6px 10px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--surface-2)',
                  cursor: 'pointer', color: 'var(--text)',
                }}>
                  Asosiy qilish
                </button>
              )}
              <button onClick={() => setEditing(a)} style={{
                fontSize: 12, padding: '6px 10px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--surface-2)',
                cursor: 'pointer', color: 'var(--text)',
              }}>
                Tahrirlash
              </button>
              <button onClick={() => remove(a.id)} style={{
                fontSize: 12, padding: '6px 10px', borderRadius: 8,
                border: 'none', background: 'transparent',
                cursor: 'pointer', color: '#ef4444', marginLeft: 'auto',
              }}>
                O&apos;chirish
              </button>
            </div>
          </div>
        ))}
      </div>

      {(adding || editing) && (
        <AddressModal
          initial={editing}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={async () => { setAdding(false); setEditing(null); await load(); }}
        />
      )}

      <BottomNav />
    </div>
  );
}

function AddressModal({
  initial, onClose, onSaved,
}: {
  initial: Address | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? 'Uy');
  const [text, setText] = useState(initial?.addressText ?? '');
  const [lat, setLat] = useState(initial ? Number(initial.lat) : 41.3111);
  const [lng, setLng] = useState(initial ? Number(initial.lng) : 69.2797);
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleMapSelect = async (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    try {
      const place = await reverseGeocode(newLat, newLng);
      if (place) setText(place);
    } catch {/* ignore */}
  };

  const save = async () => {
    if (!label.trim() || !text.trim()) {
      setError("Nomi va manzil matnini kiriting");
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (initial) {
        await api(`/addresses/${initial.id}`, {
          method: 'PATCH',
          body: { label, addressText: text, lat, lng, isDefault },
        });
      } else {
        await api('/addresses', {
          method: 'POST',
          body: { label, addressText: text, lat, lng, isDefault },
        });
      }
      onSaved();
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
        background: 'var(--surface)', borderRadius: 16, padding: 20,
        maxWidth: 460, width: '100%', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>
            {initial ? 'Manzilni tahrirlash' : 'Yangi manzil'}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer' }}
          >×</button>
        </div>

        <div className="stack-sm">
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
            Nomi (masalan: Uy, Ish, Dacha)
          </label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Uy"
            style={{
              padding: '10px 12px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--surface-2)',
              fontSize: 14,
            }}
          />

          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginTop: 8 }}>
            Manzil
          </label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Toshkent, Yunusobod, ..."
            style={{
              padding: '10px 12px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--surface-2)',
              fontSize: 14,
            }}
          />

          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginTop: 8 }}>
            Xaritada belgilang
          </label>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', height: 260 }}>
            <LocationPickerMap
              selected={[lat, lng]}
              onSelect={handleMapSelect}
              showPickupPoints={false}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            Asosiy manzil sifatida saqlash
          </label>

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, fontSize: 12 }}>
              {error}
            </div>
          )}

          <div className="hstack" style={{ gap: 8, marginTop: 12 }}>
            <button
              className="btn ghost"
              onClick={onClose}
              disabled={saving}
              style={{ flex: 1 }}
            >Bekor</button>
            <button
              className="btn"
              onClick={save}
              disabled={saving}
              style={{ flex: 2 }}
            >
              {saving ? 'Saqlanmoqda…' : 'Saqlash'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
