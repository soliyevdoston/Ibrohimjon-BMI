'use client';
import { useState, useEffect } from 'react';
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

type Props = {
  product?: Product & { id: string };
  onClose: () => void;
  onSaved: () => void;
};

export function ProductModal({ product, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Product>(product ? { ...product, price: String(product.price), stock: String(product.stock) } : EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';

  const set = (field: keyof Product) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.price || Number(form.price) <= 0) { setError('Enter a valid price'); return; }
    if (!form.stock || Number(form.stock) < 0) { setError('Enter a valid stock quantity'); return; }
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
          <h2>{product ? 'Edit Product' : 'New Product'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="stack-sm">
          <div>
            <label className="label">Product title *</label>
            <input className="input" placeholder="e.g. Fresh Tomatoes" value={form.title} onChange={set('title')} style={{ marginTop: 4 }} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="textarea input"
              placeholder="Brief description of the product"
              value={form.description}
              onChange={set('description')}
              rows={3}
              style={{ marginTop: 4, resize: 'vertical' }}
            />
          </div>
          <div className="grid-2">
            <div>
              <label className="label">Price (so'm) *</label>
              <input className="input" type="number" placeholder="25000" value={form.price} onChange={set('price')} min={0} style={{ marginTop: 4 }} />
            </div>
            <div>
              <label className="label">Stock quantity *</label>
              <input className="input" type="number" placeholder="100" value={form.stock} onChange={set('stock')} min={0} style={{ marginTop: 4 }} />
            </div>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="select" value={form.categoryId} onChange={set('categoryId')} style={{ marginTop: 4 }}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Image URL (optional)</label>
            <input className="input" placeholder="https://…" value={form.imageUrl} onChange={set('imageUrl')} style={{ marginTop: 4 }} />
          </div>

          {form.price && Number(form.price) > 0 && (
            <div style={{ background: 'var(--primary-50)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Preview price: </span>
              <strong style={{ color: 'var(--primary-600)' }}>{money(Number(form.price))} so&apos;m</strong>
            </div>
          )}

          {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button className="btn" style={{ flex: 2 }} onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving…' : product ? 'Save changes' : 'Add product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
