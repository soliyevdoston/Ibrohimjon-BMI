'use client';

import { useMemo, useState } from 'react';
import { IconSearch } from '@/components/admin/Icon';
import { initials } from '@/lib/admin-mock';
import { useApiSellers } from '@/lib/admin-api';

function uzs(value: number) {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' soʼm';
}

export default function AdminSellersPage() {
  const { items: sellers, loading } = useApiSellers();
  const [q, setQ] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);

  const rows = useMemo(() => {
    return sellers.filter((s) => {
      if (onlyActive && !s.isActive) return false;
      if (q) {
        const needle = q.toLowerCase();
        const haystack = `${s.brandName} ${s.legalName} ${s.user.fullName ?? ''} ${s.user.email ?? ''}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [q, onlyActive, sellers]);

  const activeCount = sellers.filter((s) => s.isActive).length;
  const avgRating = sellers.length
    ? sellers.reduce((sum, s) => sum + Number(s.rating ?? 0), 0) / sellers.length
    : 0;

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
            <span className="kpi-label">O&apos;rtacha reyting</span>
            <span className="kpi-ico amber">★</span>
          </div>
          <div className="kpi-value">{avgRating.toFixed(1)}</div>
          <div className="kpi-meta">5.0 dan</div>
        </div>
        <div className="kpi">
          <div className="kpi-row">
            <span className="kpi-label">Yangi (oxirgi 7 kun)</span>
            <span className="kpi-ico green">📈</span>
          </div>
          <div className="kpi-value">
            {sellers.filter((s) => {
              const days = (Date.now() - new Date(s.createdAt).getTime()) / 86400000;
              return days <= 7;
            }).length}
          </div>
          <div className="kpi-meta">Ro&apos;yxatdan o&apos;tgan</div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Sotuvchilar</h3>
            <div className="card-sub">{loading ? 'yuklanmoqda…' : `${rows.length} ta ko'rsatilmoqda`}</div>
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
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Brend</th>
                <th>Yuridik nomi</th>
                <th>Egasi</th>
                <th>Manzil</th>
                <th>Holat</th>
                <th>Reyting</th>
                <th style={{ textAlign: 'right' }}>Komissiya</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
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
                        {initials(s.brandName)}
                      </span>
                      <div>
                        <strong>{s.brandName}</strong>
                        <div className="muted" style={{ fontSize: 12 }}>{s.user.phone ?? '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{s.legalName}</td>
                  <td>
                    <div style={{ fontSize: 13 }}>{s.user.fullName ?? '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.user.email ?? '—'}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>{s.addressText ?? '—'}</td>
                  <td>
                    <span className={`chip ${s.isActive ? 'green' : 'gray'}`}>
                      {s.isActive ? 'Faol' : "To'xtatilgan"}
                    </span>
                  </td>
                  <td>
                    <span className="hstack" style={{ gap: 4 }}>
                      <span style={{ color: '#f59e0b' }}>★</span>
                      <strong>{Number(s.rating).toFixed(1)}</strong>
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>{uzs(0)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <div className="empty-ico">∅</div>
                      <strong>{loading ? 'Yuklanmoqda…' : 'Sotuvchilar topilmadi'}</strong>
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
