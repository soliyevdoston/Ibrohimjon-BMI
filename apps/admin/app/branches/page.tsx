'use client';
import { useState } from 'react';
import { IconPlus, IconSearch, IconClose, IconCheck } from '@/components/admin/Icon';
import { useBranches, type Branch } from '@/lib/admin-store';
import { BranchForm } from '@/components/admin/forms/BranchForm';

const STATUS_CHIP: Record<Branch['status'], { label: string; tone: string }> = {
  active: { label: 'Faol', tone: 'green' },
  busy:   { label: 'Band', tone: 'amber' },
  closed: { label: 'Yopiq', tone: 'gray' },
};

export default function AdminBranchesPage() {
  const { items, add, update, remove, reset } = useBranches();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | Branch['status']>('all');
  const [editing, setEditing] = useState<Branch | null>(null);
  const [adding, setAdding] = useState(false);

  const filtered = items.filter((b) => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (q) {
      const needle = q.toLowerCase();
      if (!b.name.toLowerCase().includes(needle) &&
          !b.district.toLowerCase().includes(needle) &&
          !b.address.toLowerCase().includes(needle)) return false;
    }
    return true;
  });

  const totalCouriers = items.reduce((s, b) => s + b.couriers, 0);
  const totalCapacity = items.reduce((s, b) => s + b.capacity, 0);
  const activeCount = items.filter((b) => b.status === 'active').length;

  const handleSave = (b: Branch) => {
    if (items.find((x) => x.id === b.id)) update(b.id, b);
    else add(b);
  };

  const handleDelete = (b: Branch) => {
    if (confirm(`"${b.name}" filialini o'chirishni xohlaysizmi?`)) remove(b.id);
  };

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Jami filiallar</span>
            <span className="kpi-ico indigo">🏢</span>
          </div>
          <div className="kpi-value">{items.length}</div>
          <div className="kpi-meta">{activeCount} faol</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Kuryerlar</span>
            <span className="kpi-ico sky">🛵</span>
          </div>
          <div className="kpi-value">{totalCouriers}/{totalCapacity}</div>
          <div className="kpi-meta">{Math.round((totalCouriers / Math.max(totalCapacity, 1)) * 100)}% bandlik</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Asosiy filiallar</span>
            <span className="kpi-ico amber">⭐</span>
          </div>
          <div className="kpi-value">{items.filter((b) => b.type === 'main').length}</div>
          <div className="kpi-meta">{items.filter((b) => b.type === 'satellite').length} yordamchi</div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Filiallar</h3>
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
              <IconPlus size={14} /> Filial qo'shish
            </button>
          </div>
        </div>

        <div className="hstack" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {[
            { k: 'all' as const,    label: 'Barchasi' },
            { k: 'active' as const, label: '🟢 Faol' },
            { k: 'busy' as const,   label: '🟡 Band' },
            { k: 'closed' as const, label: '⚫ Yopiq' },
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
                <th>Filial</th>
                <th>Tuman</th>
                <th>Ish vaqti</th>
                <th>Holat</th>
                <th>Turi</th>
                <th style={{ textAlign: 'right' }}>Kuryerlar</th>
                <th style={{ textAlign: 'right' }}>Koordinatalar</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const chip = STATUS_CHIP[b.status];
                const usage = (b.couriers / b.capacity) * 100;
                return (
                  <tr key={b.id}>
                    <td>
                      <div className="tcell-primary">
                        <span className="avatar" style={{
                          width: 32, height: 32, fontSize: 14,
                          background: b.type === 'main' ? 'linear-gradient(135deg, #2563EB, #60A5FA)' : 'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
                        }}>
                          {b.type === 'main' ? '🏢' : '🏬'}
                        </span>
                        <div>
                          <strong>{b.name}</strong>
                          <div className="muted" style={{ fontSize: 12 }}>{b.address}</div>
                        </div>
                      </div>
                    </td>
                    <td>{b.district}</td>
                    <td>{b.hours}</td>
                    <td><span className={`chip ${chip.tone}`}>{chip.label}</span></td>
                    <td>{b.type === 'main' ? 'Asosiy' : 'Yordamchi'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <strong>{b.couriers}/{b.capacity}</strong>
                      <div style={{ fontSize: 11, color: usage > 80 ? '#f59e0b' : '#10b981' }}>
                        {Math.round(usage)}% band
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                      {b.lat.toFixed(4)},<br />{b.lng.toFixed(4)}
                    </td>
                    <td>
                      <div className="hstack" style={{ gap: 4, justifyContent: 'flex-end' }}>
                        <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setEditing(b)} aria-label="Tahrirlash">
                          <IconCheck size={14} />
                        </button>
                        <button className="icon-btn" style={{ width: 30, height: 30, color: '#ef4444' }} onClick={() => handleDelete(b)} aria-label="O'chirish">
                          <IconClose size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">
                      <div className="empty-ico">∅</div>
                      <strong>Filiallar topilmadi</strong>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(adding || editing) && (
        <BranchForm
          open
          onClose={() => { setAdding(false); setEditing(null); }}
          initial={editing}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
