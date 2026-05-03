'use client';
import { useState } from 'react';
import { IconPlus, IconSearch, IconClose, IconCheck } from '@/components/admin/Icon';
import { usePickups, type PickupPoint } from '@/lib/admin-store';
import { PickupForm } from '@/components/admin/forms/PickupForm';

const TYPE_META: Record<PickupPoint['type'], { emoji: string; label: string; tone: string }> = {
  mall:   { emoji: '🛍', label: 'Savdo markazi', tone: 'indigo' },
  store:  { emoji: '🏪', label: "Do'kon",         tone: 'amber' },
  kiosk:  { emoji: '🏷', label: 'Kiosk',          tone: 'sky' },
  locker: { emoji: '📦', label: 'Locker',         tone: 'green' },
};

export default function AdminPickupsPage() {
  const { items, add, update, remove, reset } = usePickups();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | PickupPoint['type']>('all');
  const [editing, setEditing] = useState<PickupPoint | null>(null);
  const [adding, setAdding] = useState(false);

  const filtered = items.filter((p) => {
    if (filter !== 'all' && p.type !== filter) return false;
    if (q) {
      const needle = q.toLowerCase();
      if (!p.name.toLowerCase().includes(needle) &&
          !p.district.toLowerCase().includes(needle) &&
          !p.address.toLowerCase().includes(needle)) return false;
    }
    return true;
  });

  const counts = {
    mall: items.filter((p) => p.type === 'mall').length,
    store: items.filter((p) => p.type === 'store').length,
    kiosk: items.filter((p) => p.type === 'kiosk').length,
    locker: items.filter((p) => p.type === 'locker').length,
  };

  const handleSave = (p: PickupPoint) => {
    if (items.find((x) => x.id === p.id)) update(p.id, p);
    else add(p);
  };

  const handleDelete = (p: PickupPoint) => {
    if (confirm(`"${p.name}" punktini o'chirishni xohlaysizmi?`)) remove(p.id);
  };

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Jami punktlar</span>
            <span className="kpi-ico indigo">📦</span>
          </div>
          <div className="kpi-value">{items.length}</div>
          <div className="kpi-meta">{counts.mall + counts.store} faol joy</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Savdo markazlari</span>
            <span className="kpi-ico amber">🛍</span>
          </div>
          <div className="kpi-value">{counts.mall}</div>
          <div className="kpi-meta">Eng katta hajmli</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">24/7 lockerlar</span>
            <span className="kpi-ico green">🔒</span>
          </div>
          <div className="kpi-value">{counts.locker}</div>
          <div className="kpi-meta">Tunda ham olish mumkin</div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Tarqatish punktlari</h3>
            <div className="card-sub">{filtered.length} ta ko'rsatilmoqda</div>
          </div>
          <div className="hstack">
            <div className="topbar-search" style={{ margin: 0, minWidth: 220 }}>
              <IconSearch size={15} />
              <input placeholder="Nom, tuman..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <button className="btn ghost sm" onClick={() => { if (confirm('Boshlang\'ich holatga qaytarilsinmi?')) reset(); }}>
              Reset
            </button>
            <button className="btn" onClick={() => setAdding(true)}>
              <IconPlus size={14} /> Punkt qo'shish
            </button>
          </div>
        </div>

        <div className="hstack" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {[
            { k: 'all' as const,    label: 'Barchasi' },
            { k: 'mall' as const,   label: '🛍 Savdo markazi' },
            { k: 'store' as const,  label: "🏪 Do'kon" },
            { k: 'kiosk' as const,  label: '🏷 Kiosk' },
            { k: 'locker' as const, label: '📦 Locker' },
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
                <th>Punkt</th>
                <th>Tuman</th>
                <th>Turi</th>
                <th>Ish vaqti</th>
                <th style={{ textAlign: 'right' }}>Koordinatalar</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const meta = TYPE_META[p.type];
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="tcell-primary">
                        <span className="avatar" style={{
                          width: 32, height: 32, fontSize: 16,
                          background: '#ecfeff', color: '#0e7490', border: '1px solid #cffafe',
                        }}>
                          {meta.emoji}
                        </span>
                        <div>
                          <strong>{p.name}</strong>
                          <div className="muted" style={{ fontSize: 12 }}>{p.address}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.district}</td>
                    <td><span className={`chip ${meta.tone}`}>{meta.label}</span></td>
                    <td>{p.hours}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                      {p.lat.toFixed(4)},<br />{p.lng.toFixed(4)}
                    </td>
                    <td>
                      <div className="hstack" style={{ gap: 4, justifyContent: 'flex-end' }}>
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
                  <td colSpan={6}>
                    <div className="empty">
                      <div className="empty-ico">∅</div>
                      <strong>Punktlar topilmadi</strong>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(adding || editing) && (
        <PickupForm
          open
          onClose={() => { setAdding(false); setEditing(null); }}
          initial={editing}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
