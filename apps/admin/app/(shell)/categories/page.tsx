'use client';
import { useState } from 'react';
import { IconPlus, IconClose, IconCheck, IconSearch } from '@/components/admin/Icon';
import { useCategories, type Category } from '@/lib/admin-store';
import { CategoryForm } from '@/components/admin/forms/CategoryForm';

export default function AdminCategoriesPage() {
  const { items, add, update, remove } = useCategories();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Category | null>(null);
  const [adding, setAdding] = useState(false);

  const filtered = items.filter((c) => {
    if (!q) return true;
    return c.name.toLowerCase().includes(q.toLowerCase());
  });

  const root = filtered.filter((c) => !c.parentId);
  const childrenOf = (id: string) => filtered.filter((c) => c.parentId === id);

  const handleSave = (c: Category) => {
    if (items.find((x) => x.id === c.id)) update(c.id, c);
    else add(c);
  };

  const handleDelete = (c: Category) => {
    if (childrenOf(c.id).length > 0) {
      alert("Bu kategoriyada subkategoriyalar bor — avval ularni o'chiring");
      return;
    }
    if (confirm(`"${c.name}" kategoriyasini o'chirishni xohlaysizmi?`)) remove(c.id);
  };

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Kategoriyalar</span>
            <span className="kpi-ico indigo">🗂</span>
          </div>
          <div className="kpi-value">{items.length}</div>
          <div className="kpi-meta">{root.length} asosiy, {items.length - root.length} subkategoriya</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Eng katta</span>
            <span className="kpi-ico amber">📦</span>
          </div>
          <div className="kpi-value">
            {items.length > 0 ? items.reduce((m, c) => c.productCount > m.productCount ? c : m).icon : '—'}
          </div>
          <div className="kpi-meta">
            {items.length > 0 ? items.reduce((m, c) => c.productCount > m.productCount ? c : m).name : '—'}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Jami mahsulotlar</span>
            <span className="kpi-ico green">🛍</span>
          </div>
          <div className="kpi-value">{items.reduce((s, c) => s + c.productCount, 0)}</div>
          <div className="kpi-meta">Barcha kategoriyalarda</div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Kategoriyalar</h3>
            <div className="card-sub">{filtered.length} ta ko'rsatilmoqda</div>
          </div>
          <div className="hstack">
            <div className="topbar-search" style={{ margin: 0, minWidth: 220 }}>
              <IconSearch size={15} />
              <input placeholder="Nomi..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <button className="btn" onClick={() => setAdding(true)}>
              <IconPlus size={14} /> Kategoriya qo'shish
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Kategoriya</th>
                <th>Tur</th>
                <th>Ota-kategoriya</th>
                <th style={{ textAlign: 'right' }}>Mahsulotlar</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {root.map((c) => (
                <CategoryRow
                  key={c.id}
                  c={c}
                  childrenOf={childrenOf}
                  onEdit={setEditing}
                  onDelete={handleDelete}
                  parentName={null}
                />
              ))}
              {root.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty">
                      <div className="empty-ico">∅</div>
                      <strong>Kategoriyalar topilmadi</strong>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(adding || editing) && (
        <CategoryForm
          open
          onClose={() => { setAdding(false); setEditing(null); }}
          initial={editing}
          parents={items}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function CategoryRow({
  c, childrenOf, onEdit, onDelete, parentName,
}: {
  c: Category;
  childrenOf: (id: string) => Category[];
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  parentName: string | null;
}) {
  const kids = childrenOf(c.id);
  return (
    <>
      <tr>
        <td>
          <div className="tcell-primary" style={{ paddingLeft: parentName ? 24 : 0 }}>
            <span style={{ fontSize: 22 }}>{c.icon}</span>
            <strong>{c.name}</strong>
          </div>
        </td>
        <td>
          <span className={`chip ${parentName ? 'sky' : 'indigo'}`}>
            {parentName ? 'Subkategoriya' : 'Asosiy'}
          </span>
        </td>
        <td>{parentName ?? <span className="muted" style={{ fontSize: 12 }}>—</span>}</td>
        <td style={{ textAlign: 'right' }}><strong>{c.productCount}</strong></td>
        <td>
          <div className="hstack" style={{ gap: 4, justifyContent: 'flex-end' }}>
            <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => onEdit(c)} aria-label="Tahrirlash">
              <IconCheck size={14} />
            </button>
            <button className="icon-btn" style={{ width: 30, height: 30, color: '#ef4444' }} onClick={() => onDelete(c)} aria-label="O'chirish">
              <IconClose size={14} />
            </button>
          </div>
        </td>
      </tr>
      {kids.map((k) => (
        <CategoryRow key={k.id} c={k} childrenOf={childrenOf} onEdit={onEdit} onDelete={onDelete} parentName={c.name} />
      ))}
    </>
  );
}
