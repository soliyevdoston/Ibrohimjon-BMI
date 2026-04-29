'use client';
import { useState, useMemo } from 'react';
import { IconPlus, IconClose, IconCheck, IconSearch } from '@/components/admin/Icon';
import { useProducts, useSellers, useCategories, type Product } from '@/lib/admin-store';
import { uzs } from '@/lib/admin-mock';
import { ProductForm } from '@/components/admin/forms/ProductForm';

const STATUS_CHIP: Record<Product['status'], { label: string; tone: string }> = {
  pending:  { label: 'Kutilmoqda',   tone: 'amber' },
  approved: { label: 'Tasdiqlangan', tone: 'green' },
  rejected: { label: 'Rad etilgan',  tone: 'rose' },
};

export default function AdminProductsPage() {
  const { items: products, add, update, remove } = useProducts();
  const { items: sellers } = useSellers();
  const { items: categories } = useCategories();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | Product['status']>('all');
  const [editing, setEditing] = useState<Product | null>(null);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => products.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (q) {
      const needle = q.toLowerCase();
      if (!p.title.toLowerCase().includes(needle) && !p.sellerName.toLowerCase().includes(needle)) {
        return false;
      }
    }
    return true;
  }), [products, q, filter]);

  const counts = {
    pending: products.filter((p) => p.status === 'pending').length,
    approved: products.filter((p) => p.status === 'approved').length,
    rejected: products.filter((p) => p.status === 'rejected').length,
  };

  const handleSave = (p: Product) => {
    if (products.find((x) => x.id === p.id)) update(p.id, p);
    else add(p);
  };

  const handleApprove = (p: Product) => update(p.id, { status: 'approved' });
  const handleReject = (p: Product) => update(p.id, { status: 'rejected' });
  const handleDelete = (p: Product) => {
    if (confirm(`"${p.title}" mahsulotini o'chirishni xohlaysizmi?`)) remove(p.id);
  };

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Jami mahsulotlar</span>
            <span className="kpi-ico indigo">📦</span>
          </div>
          <div className="kpi-value">{products.length}</div>
          <div className="kpi-meta">{counts.approved} tasdiqlangan</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Modarasiyada</span>
            <span className="kpi-ico amber">⏳</span>
          </div>
          <div className="kpi-value">{counts.pending}</div>
          <div className="kpi-meta">Tasdiqlash kutilmoqda</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Rad etilgan</span>
            <span className="kpi-ico amber">❌</span>
          </div>
          <div className="kpi-value">{counts.rejected}</div>
          <div className="kpi-meta">Sifat tekshiruvidan o'tmagan</div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Mahsulotlar</h3>
            <div className="card-sub">{filtered.length} ta ko'rsatilmoqda</div>
          </div>
          <div className="hstack">
            <div className="topbar-search" style={{ margin: 0, minWidth: 220 }}>
              <IconSearch size={15} />
              <input placeholder="Nom, sotuvchi..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <button className="btn" onClick={() => setAdding(true)}>
              <IconPlus size={14} /> Mahsulot qo'shish
            </button>
          </div>
        </div>

        <div className="hstack" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {[
            { k: 'all' as const,      label: 'Barchasi' },
            { k: 'pending' as const,  label: '⏳ Kutilmoqda' },
            { k: 'approved' as const, label: '✅ Tasdiqlangan' },
            { k: 'rejected' as const, label: '❌ Rad etilgan' },
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
                <th>Mahsulot</th>
                <th>Sotuvchi</th>
                <th>Kategoriya</th>
                <th style={{ textAlign: 'right' }}>Narxi</th>
                <th style={{ textAlign: 'right' }}>Zaxira</th>
                <th>Holat</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const cat = categories.find((c) => c.id === p.categoryId);
                const chip = STATUS_CHIP[p.status];
                return (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.title}</strong>
                      <div className="muted" style={{ fontSize: 11 }}>{p.createdAt}</div>
                    </td>
                    <td>{p.sellerName}</td>
                    <td>
                      {cat ? <span style={{ fontSize: 13 }}>{cat.icon} {cat.name}</span> : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}><strong>{uzs(p.price)}</strong></td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ color: p.stock < 10 ? '#ef4444' : 'inherit' }}>{p.stock}</span>
                    </td>
                    <td><span className={`chip ${chip.tone}`}>{chip.label}</span></td>
                    <td>
                      <div className="hstack" style={{ gap: 4, justifyContent: 'flex-end' }}>
                        {p.status === 'pending' && (
                          <>
                            <button className="btn green sm" onClick={() => handleApprove(p)}>Tasdiqlash</button>
                            <button className="btn ghost sm" onClick={() => handleReject(p)}>Rad etish</button>
                          </>
                        )}
                        <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setEditing(p)} aria-label="Tahrirlash">
                          <IconCheck size={14} />
                        </button>
                        <button className="icon-btn" style={{ width: 30, height: 30, color: '#ef4444' }} onClick={() => handleDelete(p)} aria-label="O'chirish">
                          <IconClose size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <div className="empty-ico">∅</div>
                      <strong>Mahsulotlar topilmadi</strong>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(adding || editing) && (
        <ProductForm
          open
          onClose={() => { setAdding(false); setEditing(null); }}
          initial={editing}
          sellers={sellers}
          categories={categories}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
