'use client';

import { useMemo, useState } from 'react';
import { IconClose, IconCheck, IconPlus, IconSearch } from '@/components/admin/Icon';
import { initials, uzs } from '@/lib/admin-mock';
import { useSellers, useCategories, type MockSeller } from '@/lib/admin-store';
import { SellerForm } from '@/components/admin/forms/SellerForm';

type Seller = MockSeller & {
  categoryId?: string;
  lat?: number;
  lng?: number;
  address?: string;
};

export default function AdminSellersPage() {
  const { items: sellers, add, update, remove } = useSellers();
  const { items: categories } = useCategories();
  const [q, setQ] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);
  const [editing, setEditing] = useState<Seller | null>(null);
  const [adding, setAdding] = useState(false);

  const rows = useMemo(() => {
    return sellers.filter((s) => {
      if (onlyActive && !s.isActive) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (!s.brand.toLowerCase().includes(needle) && !s.owner.toLowerCase().includes(needle)) {
          return false;
        }
      }
      return true;
    });
  }, [q, onlyActive, sellers]);

  const activeCount = sellers.filter((s) => s.isActive).length;
  const totalRev = sellers.reduce((s, x) => s + x.revenueToday, 0);
  const totalOrders = sellers.reduce((s, x) => s + x.ordersToday, 0);

  const handleSave = (s: Seller) => {
    if (sellers.find((x) => x.id === s.id)) update(s.id, s);
    else add(s);
  };

  const handleDelete = (s: Seller) => {
    if (confirm(`${s.brand} sotuvchisini o'chirishni xohlaysizmi?`)) remove(s.id);
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
            <span className="kpi-label">Bugungi buyurtmalar</span>
            <span className="kpi-ico sky">📦</span>
          </div>
          <div className="kpi-value">{totalOrders}</div>
          <div className="kpi-meta">Barcha sotuvchilar</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Bugungi daromad</span>
            <span className="kpi-ico green">💰</span>
          </div>
          <div className="kpi-value">{uzs(totalRev)}</div>
          <div className="kpi-meta">Yalpi tushum</div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Sotuvchilar</h3>
            <div className="card-sub">{rows.length} ta ko'rsatilmoqda</div>
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
            <button className="btn" onClick={() => setAdding(true)}>
              <IconPlus size={14} /> Sotuvchi qo'shish
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Brend</th>
                <th>Egasi</th>
                <th>Kategoriya</th>
                <th>Holat</th>
                <th>Reyting</th>
                <th style={{ textAlign: 'right' }}>Mahsulotlar</th>
                <th style={{ textAlign: 'right' }}>Bugungi buyurtmalar</th>
                <th style={{ textAlign: 'right' }}>Daromad</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const cat = categories.find((c) => c.id === s.categoryId);
                return (
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
                          {initials(s.brand)}
                        </span>
                        <div>
                          <strong>{s.brand}</strong>
                          <div className="muted" style={{ fontSize: 12 }}>{s.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>{s.owner}</td>
                    <td>
                      {cat ? <span style={{ fontSize: 13 }}>{cat.icon} {cat.name}</span> : <span className="muted" style={{ fontSize: 12 }}>—</span>}
                    </td>
                    <td>
                      <span className={`chip ${s.isActive ? 'green' : 'gray'}`}>
                        {s.isActive ? 'Faol' : "To'xtatilgan"}
                      </span>
                    </td>
                    <td>
                      <span className="hstack" style={{ gap: 4 }}>
                        <span style={{ color: '#f59e0b' }}>★</span>
                        <strong>{s.rating.toFixed(1)}</strong>
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>{s.productsCount}</td>
                    <td style={{ textAlign: 'right' }}><strong>{s.ordersToday}</strong></td>
                    <td style={{ textAlign: 'right' }}>{uzs(s.revenueToday)}</td>
                    <td>
                      <div className="hstack" style={{ gap: 4, justifyContent: 'flex-end' }}>
                        <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setEditing(s)} aria-label="Tahrirlash">
                          <IconCheck size={14} />
                        </button>
                        <button className="icon-btn" style={{ width: 30, height: 30, color: '#ef4444' }} onClick={() => handleDelete(s)} aria-label="O'chirish">
                          <IconClose size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="empty">
                      <div className="empty-ico">∅</div>
                      <strong>Sotuvchilar topilmadi</strong>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(adding || editing) && (
        <SellerForm
          open
          onClose={() => { setAdding(false); setEditing(null); }}
          initial={editing}
          categories={categories}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
