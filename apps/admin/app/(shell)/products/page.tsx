'use client';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { IconSearch } from '@/components/admin/Icon';
import { useApiProducts, useApiCategories, numFromStr } from '@/lib/admin-api';
import { imgUrl } from '@/lib/api';

function uzs(value: number) {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' soʼm';
}

export default function AdminProductsPage() {
  const { items: products, loading } = useApiProducts();
  const { items: categories } = useApiCategories();
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = useMemo(() => products.filter((p) => {
    if (filter === 'active' && !p.isActive) return false;
    if (filter === 'inactive' && p.isActive) return false;
    if (categoryId !== 'all' && p.categoryId !== categoryId) return false;
    if (q) {
      const needle = q.toLowerCase();
      const haystack = `${p.title} ${p.description ?? ''} ${p.seller?.brandName ?? ''}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  }), [products, q, filter, categoryId]);

  const active = products.filter((p) => p.isActive).length;
  const lowStock = products.filter((p) => p.isActive && p.stock < 10).length;

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Jami mahsulotlar</span>
            <span className="kpi-ico indigo">📦</span>
          </div>
          <div className="kpi-value">{products.length}</div>
          <div className="kpi-meta">{active} faol</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Kategoriyalar</span>
            <span className="kpi-ico sky">🏷</span>
          </div>
          <div className="kpi-value">{categories.length}</div>
          <div className="kpi-meta">Platforma kategoriyalari</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Kam zaxira</span>
            <span className="kpi-ico amber">⚠</span>
          </div>
          <div className="kpi-value">{lowStock}</div>
          <div className="kpi-meta">10 dan kam qolgan</div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Mahsulotlar</h3>
            <div className="card-sub">
              {loading ? 'yuklanmoqda…' : `${filtered.length} ta ko'rsatilmoqda`}
            </div>
          </div>
          <div className="hstack">
            <div className="topbar-search" style={{ margin: 0, minWidth: 220 }}>
              <IconSearch size={15} />
              <input placeholder="Nom, sotuvchi..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
              }}
            >
              <option value="all">Barcha kategoriyalar</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="hstack" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {[
            { k: 'all' as const,      label: 'Barchasi' },
            { k: 'active' as const,   label: 'Faol' },
            { k: 'inactive' as const, label: 'Nofaol' },
          ].map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              className={`btn ${filter === f.k ? 'soft' : 'ghost'} sm`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Mahsulot</th>
                <th>Sotuvchi</th>
                <th>Kategoriya</th>
                <th style={{ textAlign: 'right' }}>Narxi</th>
                <th style={{ textAlign: 'right' }}>Zaxira</th>
                <th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td style={{ width: 50 }}>
                    {p.imageUrl ? (
                      <Image
                        src={imgUrl(p.imageUrl) ?? ''}
                        alt={p.title}
                        width={40}
                        height={40}
                        style={{ borderRadius: 6, objectFit: 'cover' }}
                        unoptimized
                      />
                    ) : (
                      <div style={{ width: 40, height: 40, background: 'var(--surface-2)', borderRadius: 6 }} />
                    )}
                  </td>
                  <td>
                    <strong>{p.title}</strong>
                    <div className="muted" style={{ fontSize: 11 }}>
                      {new Date(p.createdAt).toLocaleDateString('uz-UZ')}
                    </div>
                  </td>
                  <td>{p.seller?.brandName ?? '—'}</td>
                  <td style={{ fontSize: 13 }}>{p.category?.name ?? '—'}</td>
                  <td style={{ textAlign: 'right' }}><strong>{uzs(numFromStr(p.price))}</strong></td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ color: p.stock < 10 ? '#ef4444' : 'inherit' }}>{p.stock}</span>
                  </td>
                  <td>
                    <span className={`chip ${p.isActive ? 'green' : 'gray'}`}>
                      {p.isActive ? 'Faol' : 'Nofaol'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <div className="empty-ico">∅</div>
                      <strong>{loading ? 'Yuklanmoqda…' : 'Mahsulotlar topilmadi'}</strong>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
