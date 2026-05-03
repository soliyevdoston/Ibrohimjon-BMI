'use client';

import { useMemo, useState } from 'react';
import { IconClose, IconCheck, IconSearch } from '@/components/admin/Icon';
import { initials, uzs } from '@/lib/admin-mock';
import { useCustomers } from '@/lib/admin-store';

export default function AdminUsersPage() {
  const { items: customers, update, remove } = useCustomers();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED' | 'BLOCKED'>('ALL');

  const rows = useMemo(() => {
    return customers.filter((c) => {
      if (filter === 'VERIFIED' && !c.isVerified) return false;
      if (filter === 'UNVERIFIED' && c.isVerified) return false;
      if (filter === 'BLOCKED' && !c.isBlocked) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (!c.name.toLowerCase().includes(needle) && !c.phone.toLowerCase().includes(needle)) {
          return false;
        }
      }
      return true;
    });
  }, [q, filter, customers]);

  const verified = customers.filter((c) => c.isVerified).length;
  const blocked = customers.filter((c) => c.isBlocked).length;
  const totalSpend = customers.reduce((s, x) => s + x.spend, 0);

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Mijozlar</span>
            <span className="kpi-ico indigo">👤</span>
          </div>
          <div className="kpi-value">{customers.length}</div>
          <div className="kpi-meta">{verified} tasdiqlangan, {blocked} bloklangan</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Umumiy xarid</span>
            <span className="kpi-ico green">💵</span>
          </div>
          <div className="kpi-value">{uzs(totalSpend)}</div>
          <div className="kpi-meta">Barcha mijozlar</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">O'rtacha buyurtma</span>
            <span className="kpi-ico sky">📦</span>
          </div>
          <div className="kpi-value">
            {(customers.reduce((s, x) => s + x.ordersCount, 0) / Math.max(customers.length, 1)).toFixed(1)}
          </div>
          <div className="kpi-meta">Har bir mijoz uchun</div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Mijozlar</h3>
            <div className="card-sub">{rows.length} ta ko'rsatilmoqda</div>
          </div>
          <div className="hstack">
            <div className="hstack" style={{ gap: 6 }}>
              <button onClick={() => setFilter('ALL')} className={`btn ${filter === 'ALL' ? 'soft' : 'ghost'} sm`}>Barchasi</button>
              <button onClick={() => setFilter('VERIFIED')} className={`btn ${filter === 'VERIFIED' ? 'soft' : 'ghost'} sm`}>Tasdiqlangan</button>
              <button onClick={() => setFilter('UNVERIFIED')} className={`btn ${filter === 'UNVERIFIED' ? 'soft' : 'ghost'} sm`}>Tasdiqlanmagan</button>
              <button onClick={() => setFilter('BLOCKED')} className={`btn ${filter === 'BLOCKED' ? 'soft' : 'ghost'} sm`}>Bloklangan</button>
            </div>
            <div className="topbar-search" style={{ margin: 0, minWidth: 220 }}>
              <IconSearch size={15} />
              <input placeholder="Ism, telefon..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Mijoz</th>
                <th>Telefon</th>
                <th>Holat</th>
                <th style={{ textAlign: 'right' }}>Buyurtmalar</th>
                <th style={{ textAlign: 'right' }}>Umumiy xarid</th>
                <th style={{ textAlign: 'right' }}>Faollik</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} style={c.isBlocked ? { opacity: 0.55 } : undefined}>
                  <td>
                    <div className="tcell-primary">
                      <span className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                        {initials(c.name)}
                      </span>
                      <strong>{c.name}</strong>
                    </div>
                  </td>
                  <td>{c.phone}</td>
                  <td>
                    {c.isBlocked ? (
                      <span className="chip rose">Bloklangan</span>
                    ) : (
                      <span className={`chip ${c.isVerified ? 'green' : 'gray'}`}>
                        {c.isVerified ? 'Tasdiqlangan' : 'Tasdiqlanmagan'}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}><strong>{c.ordersCount}</strong></td>
                  <td style={{ textAlign: 'right' }}>{uzs(c.spend)}</td>
                  <td style={{ textAlign: 'right' }} className="muted">{c.lastActive}</td>
                  <td>
                    <div className="hstack" style={{ gap: 4, justifyContent: 'flex-end' }}>
                      {c.isBlocked ? (
                        <button className="btn green sm" onClick={() => update(c.id, { isBlocked: false })}>
                          Blokdan chiqarish
                        </button>
                      ) : (
                        <button className="btn ghost sm" onClick={() => {
                          if (confirm(`${c.name} mijozni bloklashni xohlaysizmi?`)) update(c.id, { isBlocked: true });
                        }}>
                          Bloklash
                        </button>
                      )}
                      {!c.isVerified && !c.isBlocked && (
                        <button className="icon-btn" style={{ width: 30, height: 30 }} title="Tasdiqlash" onClick={() => update(c.id, { isVerified: true })}>
                          <IconCheck size={14} />
                        </button>
                      )}
                      <button className="icon-btn" style={{ width: 30, height: 30, color: '#ef4444' }} title="O'chirish" onClick={() => {
                        if (confirm(`${c.name} mijozni butunlay o'chirishni xohlaysizmi?`)) remove(c.id);
                      }}>
                        <IconClose size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <div className="empty-ico">∅</div>
                      <strong>Mijozlar topilmadi</strong>
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
