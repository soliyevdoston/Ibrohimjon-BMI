'use client';
import { useEffect, useState, useRef } from 'react';
import { api, money, API_BASE_URL, WS_BASE_URL, imgUrl } from '@/lib/api';

type Product = {
  id?: string;
  title: string;
  description: string;
  price: string;
  originalPrice: string;
  costPrice: string;
  stock: string;
  categoryId: string;
  imageUrl: string;
  imageUrls: string[];
  isActive: boolean;
};

type Category = { id: string; name: string; slug: string };

const EMPTY: Product = {
  title: '', description: '', price: '', originalPrice: '', costPrice: '', stock: '',
  categoryId: '', imageUrl: '', imageUrls: [], isActive: true,
};

const MAX_GALLERY = 4;

async function uploadFile(file: File, token: string): Promise<string> {
  if (file.size > 8 * 1024 * 1024) throw new Error("Rasm hajmi 8MB dan katta bo'lmasligi kerak");
  if (!file.type.startsWith('image/')) throw new Error('Faqat rasm fayllari qabul qilinadi');
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_BASE_URL}/uploads`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Yuklash muvaffaqiyatsiz');
  }
  const { url } = await res.json() as { url: string };
  return `${WS_BASE_URL}${url}`;
}

type Props = {
  product?: (Product & { id: string }) & { originalPrice?: string | number | null };
  onClose: () => void;
  onSaved: () => void;
};

export function ProductModal({ product, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Product>(
    product
      ? {
          ...product,
          price: String(product.price),
          originalPrice: product.originalPrice ? String(product.originalPrice) : '',
          costPrice: (product as Product & { costPrice?: string | number | null }).costPrice
            ? String((product as Product & { costPrice?: string | number | null }).costPrice)
            : '',
          stock: String(product.stock),
          imageUrls: Array.isArray((product as Product & { imageUrls?: string[] }).imageUrls)
            ? ((product as Product & { imageUrls?: string[] }).imageUrls ?? [])
            : [],
        }
      : EMPTY
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';

  useEffect(() => {
    let cancelled = false;
    api<Category[]>('/products/categories')
      .then((cats) => {
        if (cancelled) return;
        setCategories(cats);
        if (!product && cats.length > 0) {
          setForm((prev) => prev.categoryId ? prev : { ...prev, categoryId: cats[0].id });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [product]);

  const set = (field: keyof Product) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleFile = async (file: File) => {
    setError('');
    setUploading(true);
    try {
      const url = await uploadFile(file, token);
      setForm((prev) => ({ ...prev, imageUrl: url }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryFile = async (file: File) => {
    setError('');
    try {
      const url = await uploadFile(file, token);
      setForm((p) => ({ ...p, imageUrls: [...p.imageUrls, url] }));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Mahsulot nomi kerak'); return; }
    if (!form.categoryId) { setError('Kategoriya tanlang'); return; }
    if (!form.price || Number(form.price) <= 0) { setError("Narxni to'g'ri kiriting"); return; }
    if (!form.stock || Number(form.stock) < 0) { setError("Zaxira sonini to'g'ri kiriting"); return; }
    const origNum = form.originalPrice ? Number(form.originalPrice) : 0;
    if (origNum && origNum <= Number(form.price)) {
      setError("Asl narx joriy narxdan katta bo'lishi kerak (chegirma uchun)");
      return;
    }
    setLoading(true); setError('');
    try {
      const costNum = form.costPrice ? Number(form.costPrice) : 0;
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        originalPrice: origNum > 0 ? origNum : undefined,
        costPrice: costNum > 0 ? costNum : undefined,
        stock: Number(form.stock),
        categoryId: form.categoryId,
        imageUrl: form.imageUrl.trim() || undefined,
        imageUrls: form.imageUrls.filter((u) => u.trim()),
        isActive: form.isActive,
      };
      if (product?.id) {
        await api(`/products/${product.id}`, { method: 'PATCH', body, token });
      } else {
        await api('/products', { method: 'POST', body, token });
      }
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{product ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="stack-sm">
          <div>
            <label className="label">Mahsulot nomi *</label>
            <input className="input" placeholder="masalan, Yangi pomidor" value={form.title} onChange={set('title')} style={{ marginTop: 4 }} />
          </div>
          <div>
            <label className="label">Tavsif</label>
            <textarea
              className="textarea input"
              placeholder="Mahsulot haqida qisqa ma'lumot"
              value={form.description}
              onChange={set('description')}
              rows={3}
              style={{ marginTop: 4, resize: 'vertical' }}
            />
          </div>
          <div className="grid-2">
            <div>
              <label className="label">Narx (so&apos;m) *</label>
              <input className="input" type="number" placeholder="25000" value={form.price} onChange={set('price')} min={0} style={{ marginTop: 4 }} />
            </div>
            <div>
              <label className="label">Zaxira *</label>
              <input className="input" type="number" placeholder="100" value={form.stock} onChange={set('stock')} min={0} style={{ marginTop: 4 }} />
            </div>
          </div>

          <div>
            <label className="label">Tannarx — kelish narxi (ixtiyoriy)</label>
            <input
              className="input"
              type="number"
              placeholder="masalan, 18000 — foyda hisoblash uchun"
              value={form.costPrice}
              onChange={set('costPrice')}
              min={0}
              style={{ marginTop: 4 }}
            />
            {form.costPrice && Number(form.costPrice) > 0 && Number(form.price) > 0 && (
              <div style={{ fontSize: 12, marginTop: 4, fontWeight: 600, color: Number(form.price) > Number(form.costPrice) ? '#10b981' : '#ef4444' }}>
                Foyda: {money(Number(form.price) - Number(form.costPrice))} so&apos;m
                {' '}({Math.round((Number(form.price) - Number(form.costPrice)) / Number(form.costPrice) * 100)}%)
              </div>
            )}
          </div>

          <div>
            <label className="label">Asl narx (chegirma uchun, ixtiyoriy)</label>
            <input
              className="input"
              type="number"
              placeholder="30000 — bo'sh qoldirsa chegirma yo'q"
              value={form.originalPrice}
              onChange={set('originalPrice')}
              min={0}
              style={{ marginTop: 4 }}
            />
            {form.originalPrice && Number(form.originalPrice) > Number(form.price) && Number(form.price) > 0 && (
              <div style={{ fontSize: 12, color: '#10b981', marginTop: 4, fontWeight: 600 }}>
                –{Math.round((1 - Number(form.price) / Number(form.originalPrice)) * 100)}% chegirma
              </div>
            )}
          </div>
          <div>
            <label className="label">Kategoriya *</label>
            <select className="select" value={form.categoryId} onChange={set('categoryId')} style={{ marginTop: 4 }}>
              <option value="" disabled>— Kategoriya tanlang —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* ACTIVE / INACTIVE TOGGLE — sotuvchi mahsulotni o'chirmasdan yashira oladi */}
          <div
            onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 12, padding: '10px 14px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--surface-2)',
              cursor: 'pointer',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                {form.isActive ? 'Faol — mijozlarga ko’rinadi' : 'Nofaol — yashirilgan'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Nofaol mahsulot katalogda ko&apos;rinmaydi va sotib olib bo&apos;lmaydi.
              </div>
            </div>
            <span
              role="switch"
              aria-checked={form.isActive}
              style={{
                flexShrink: 0, width: 44, height: 26, borderRadius: 13,
                background: form.isActive ? '#10b981' : '#cbd5e1',
                position: 'relative', transition: 'background 150ms ease',
              }}
            >
              <span style={{
                position: 'absolute', top: 3, left: form.isActive ? 21 : 3,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                transition: 'left 150ms ease', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </span>
          </div>

          {/* IMAGE UPLOAD */}
          <div>
            <label className="label">Rasm</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />

            {form.imageUrl ? (
              <div style={{
                marginTop: 6,
                position: 'relative',
                borderRadius: 12,
                border: '1px solid var(--border)',
                overflow: 'hidden',
                background: '#f1f5f9',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgUrl(form.imageUrl)}
                  alt="Mahsulot rasmi"
                  style={{ width: '100%', maxHeight: 220, objectFit: 'contain', display: 'block' }}
                  onError={() => setError("Rasm yuklanmadi — qayta urinib ko'ring")}
                />
                <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '6px 10px', borderRadius: 8, border: 'none',
                      background: 'rgba(15,23,42,0.85)', color: '#fff',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}
                  >🔄 O&apos;zgartirish</button>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))}
                    style={{
                      padding: '6px 10px', borderRadius: 8, border: 'none',
                      background: 'rgba(239,68,68,0.95)', color: '#fff',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}
                  >✕ O&apos;chirish</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFile(f);
                }}
                style={{
                  marginTop: 6, borderRadius: 12,
                  border: `2px dashed ${dragOver ? '#4f46e5' : 'var(--border)'}`,
                  background: dragOver ? '#eef2ff' : 'var(--surface-2)',
                  padding: '24px 16px', textAlign: 'center',
                  cursor: uploading ? 'wait' : 'pointer',
                  transition: 'all 150ms ease',
                  opacity: uploading ? 0.6 : 1,
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 6 }}>{uploading ? '⏳' : '📷'}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                  {uploading ? 'Serverga yuklanmoqda…' : 'Rasm yuklash'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Bosing yoki shu yerga tashlang · JPG, PNG, WebP · max 8MB
                </div>
              </div>
            )}

            {/* Additional gallery images (up to 4 extra shots) */}
            <div style={{ marginTop: 14 }}>
              <label className="label">
                Qo&apos;shimcha rasmlar ({form.imageUrls.length}/{MAX_GALLERY})
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 6 }}>
                {form.imageUrls.map((url, i) => (
                  <div key={i} style={{
                    position: 'relative', aspectRatio: '1',
                    borderRadius: 10, overflow: 'hidden',
                    border: '1px solid var(--border)',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl(url)} alt={`Galereya ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, imageUrls: p.imageUrls.filter((_, idx) => idx !== i) }))}
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 24, height: 24, borderRadius: 6,
                        background: 'rgba(239,68,68,0.95)', border: 'none',
                        color: '#fff', fontSize: 12, fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >×</button>
                  </div>
                ))}
                {form.imageUrls.length < MAX_GALLERY && (
                  <label style={{
                    aspectRatio: '1', borderRadius: 10,
                    border: '2px dashed var(--border)',
                    background: 'var(--surface-2)',
                    display: 'grid', placeItems: 'center',
                    cursor: 'pointer', fontSize: 22, color: 'var(--text-muted)',
                  }}>
                    +
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        await handleGalleryFile(f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                Asosiy rasmga qo&apos;shimcha — mahsulot detail sahifasida galereya bo&apos;lib ko&apos;rinadi.
              </div>
            </div>
          </div>

          {form.price && Number(form.price) > 0 && (
            <div style={{ background: 'var(--primary-50, #eef2ff)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Ko&apos;rinish narxi: </span>
              <strong style={{ color: 'var(--primary-600, #4338ca)' }}>{money(Number(form.price))} so&apos;m</strong>
            </div>
          )}

          {error && <p style={{ color: 'var(--danger, #ef4444)', fontSize: 13 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={onClose}>Bekor</button>
            <button className="btn" style={{ flex: 2 }} onClick={handleSubmit} disabled={loading || uploading}>
              {loading ? 'Saqlanmoqda…' : product ? 'Saqlash' : "Mahsulot qo'shish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
