'use client';
import { useState, useRef } from 'react';
import { api, money } from '@/lib/api';

type Product = {
  id?: string;
  title: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  imageUrl: string;
  isActive: boolean;
};

const CATEGORIES = [
  { id: 'food', name: 'Food & Drinks' },
  { id: 'grocery', name: 'Grocery' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'home', name: 'Home & Garden' },
  { id: 'beauty', name: 'Beauty & Care' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'other', name: 'Other' },
];

const EMPTY: Product = {
  title: '', description: '', price: '', stock: '',
  categoryId: 'food', imageUrl: '', isActive: true,
};

const MAX_DIMENSION = 1000;
const JPEG_QUALITY = 0.82;

async function compressToDataUrl(file: File): Promise<string> {
  if (file.size > 8 * 1024 * 1024) throw new Error('Rasm hajmi 8MB dan katta bo\'lmasligi kerak');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(MAX_DIMENSION / img.width, MAX_DIMENSION / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas yaratilmadi')); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.onerror = () => reject(new Error('Rasmni o\'qib bo\'lmadi'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Faylni o\'qib bo\'lmadi'));
    reader.readAsDataURL(file);
  });
}

type Props = {
  product?: Product & { id: string };
  onClose: () => void;
  onSaved: () => void;
};

export function ProductModal({ product, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Product>(
    product ? { ...product, price: String(product.price), stock: String(product.stock) } : EMPTY
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';

  const set = (field: keyof Product) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError("Faqat rasm fayllari qabul qilinadi (JPG, PNG, WebP)");
      return;
    }
    setError('');
    setUploading(true);
    try {
      const dataUrl = await compressToDataUrl(file);
      setForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Mahsulot nomi kerak'); return; }
    if (!form.price || Number(form.price) <= 0) { setError("Narxni to'g'ri kiriting"); return; }
    if (!form.stock || Number(form.stock) < 0) { setError("Zaxira sonini to'g'ri kiriting"); return; }
    setLoading(true); setError('');
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        categoryId: form.categoryId,
        imageUrl: form.imageUrl.trim() || undefined,
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
            <label className="label">Kategoriya</label>
            <select className="select" value={form.categoryId} onChange={set('categoryId')} style={{ marginTop: 4 }}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
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
                  src={form.imageUrl}
                  alt="Mahsulot rasmi"
                  style={{ width: '100%', maxHeight: 220, objectFit: 'contain', display: 'block' }}
                  onError={() => setError('Rasm URL ochilmadi — fayl yuklang yoki boshqa URL kiriting')}
                />
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  display: 'flex', gap: 6,
                }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'rgba(15,23,42,0.85)',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >🔄 O&apos;zgartirish</button>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'rgba(239,68,68,0.95)',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >✕ O&apos;chirish</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
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
                  marginTop: 6,
                  borderRadius: 12,
                  border: `2px dashed ${dragOver ? '#4f46e5' : 'var(--border)'}`,
                  background: dragOver ? '#eef2ff' : 'var(--surface-2)',
                  padding: '24px 16px',
                  textAlign: 'center',
                  cursor: uploading ? 'wait' : 'pointer',
                  transition: 'all 150ms ease',
                  opacity: uploading ? 0.6 : 1,
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 6 }}>{uploading ? '⏳' : '📷'}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                  {uploading ? 'Yuklanmoqda…' : 'Rasm yuklash'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Bosing yoki shu yerga tashlang · JPG, PNG, WebP · max 8MB
                </div>
              </div>
            )}

            {/* Optional URL alternative */}
            <details style={{ marginTop: 8 }}>
              <summary style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                Yoki rasm URL&apos;ini kiriting
              </summary>
              <input
                className="input"
                placeholder="https://images.unsplash.com/…"
                value={form.imageUrl.startsWith('data:') ? '' : form.imageUrl}
                onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                style={{ marginTop: 6 }}
              />
            </details>
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
              {loading ? 'Saqlanmoqda…' : product ? 'Saqlash' : 'Mahsulot qo\'shish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
