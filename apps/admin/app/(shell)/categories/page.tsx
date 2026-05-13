'use client';
import { useState } from 'react';
import { IconSearch } from '@/components/admin/Icon';
import { useApiCategories, useApiProducts } from '@/lib/admin-api';

export default function AdminCategoriesPage() {
  const { items: categories, loading } = useApiCategories();
  const { items: products } = useApiProducts();
  const [q, setQ] = useState('');

  const filtered = categories.filter((c) => {
    if (!q) return true;
    return c.name.toLowerCase().includes(q.toLowerCase()) || c.slug.toLowerCase().includes(q.toLowerCase());
  });

  const productCountByCategory = (id: string) =>
    products.filter((p) => p.categoryId === id && p.isActive).length;

  const totalProducts = products.filter((p) => p.isActive).length;
  const biggest = categories.length
    ? categories.reduce((best, c) =>
        productCountByCategory(c.id) > productCountByCategory(best.id) ? c : best,
      categories[0])
    : null;

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Kategoriyalar</span>
            <span className="kpi-ico indigo">🗂</span>
          </div>
          <div className="kpi-value">{categories.length}</div>
          <div className="kpi-meta">Platforma kataloglari</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Eng katta kategoriya</span>
            <span className="kpi-ico amber">📦</span>
          </div>
          <div className="kpi-value" style={{ fontSize: 18 }}>{biggest?.name ?? '—'}</div>
          <div className="kpi-meta">
            {biggest ? `${productCountByCategory(biggest.id)} ta mahsulot` : '—'}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Faol mahsulotlar</span>
            <span className="kpi-ico green">🛍</span>
          </div>
          <div className="kpi-value">{totalProducts}</div>
          <div className="kpi-meta">Barcha kategoriyalarda</div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Kategoriyalar</h3>
            <div className="card-sub">{loading ? 'yuklanmoqda…' : `${filtered.length} ta ko'rsatilmoqda`}</div>
          </div>
          <div className="hstack">
            <div className="topbar-search" style={{ margin: 0, minWidth: 220 }}>
              <IconSearch size={15} />
              <input placeholder="Nomi yoki slug..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nomi</th>
                <th>Slug</th>
                <th style={{ textAlign: 'right' }}>Mahsulotlar</th>
                <th style={{ textAlign: 'right' }}>Yaratilgan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td><code style={{ fontSize: 12 }}>{c.slug}</code></td>
                  <td style={{ textAlign: 'right' }}>
                    <strong>{productCountByCategory(c.id)}</strong>
                  </td>
                  <td style={{ textAlign: 'right' }} className="muted">
                    {new Date(c.createdAt).toLocaleDateString('uz-UZ')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="empty">
                      <div className="empty-ico">∅</div>
                      <strong>{loading ? 'Yuklanmoqda…' : 'Kategoriyalar topilmadi'}</strong>
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
