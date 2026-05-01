'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Toast } from '@/components/admin/Toast';

interface PlatformConfig {
  commissionRate: number;
  serviceFeeRate: number;
  deliveryBaseFee: number;
  deliveryPerKmFee: number;
  freeDeliveryAbove: number;
  bikeMaxKg: number;
  carMaxKg: number;
  vanMaxKg: number;
}

export default function AdminSettingsPage() {
  const [cfg, setCfg] = useState<PlatformConfig>({
    commissionRate: 0.10,
    serviceFeeRate: 0.02,
    deliveryBaseFee: 6000,
    deliveryPerKmFee: 1400,
    freeDeliveryAbove: 0,
    bikeMaxKg: 10,
    carMaxKg: 50,
    vanMaxKg: 300,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    api<PlatformConfig>('/admin/config')
      .then((data) => setCfg({
        commissionRate: Number(data.commissionRate),
        serviceFeeRate: Number(data.serviceFeeRate),
        deliveryBaseFee: Number(data.deliveryBaseFee),
        deliveryPerKmFee: Number(data.deliveryPerKmFee),
        freeDeliveryAbove: Number(data.freeDeliveryAbove),
        bikeMaxKg: Number(data.bikeMaxKg),
        carMaxKg: Number(data.carMaxKg),
        vanMaxKg: Number(data.vanMaxKg),
      }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof PlatformConfig, val: string) => {
    setCfg((prev) => ({ ...prev, [key]: parseFloat(val) || 0 }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await api('/admin/config', { method: 'PATCH', body: cfg });
      setToast('Sozlamalar saqlandi');
      setTimeout(() => setToast(''), 2400);
    } catch {
      setToast('Xato yuz berdi');
      setTimeout(() => setToast(''), 2400);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="muted">Yuklanmoqda…</div>;

  return (
    <div className="stack">
      <div className="grid-2">
        {/* Delivery pricing */}
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Yetkazib berish narxi (BIKE)</h3>
              <div className="card-sub">Barcha yangi buyurtmalarga qo&apos;llanadi</div>
            </div>
          </div>
          <div className="stack">
            <div>
              <div className="label">Boshlang&apos;ich to&apos;lov (so&apos;m)</div>
              <input className="input" type="number" value={cfg.deliveryBaseFee}
                onChange={(e) => set('deliveryBaseFee', e.target.value)} />
            </div>
            <div>
              <div className="label">1 km uchun to&apos;lov (so&apos;m)</div>
              <input className="input" type="number" value={cfg.deliveryPerKmFee}
                onChange={(e) => set('deliveryPerKmFee', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Free delivery */}
        <div className="card" style={{ borderColor: cfg.freeDeliveryAbove > 0 ? '#10b981' : undefined }}>
          <div className="card-h">
            <div>
              <h3>Bepul yetkazib berish</h3>
              <div className="card-sub">
                {cfg.freeDeliveryAbove > 0
                  ? `${cfg.freeDeliveryAbove.toLocaleString()} so'm dan yuqorida — bepul`
                  : 'O\'chirilgan (0 = o\'chirish)'}
              </div>
            </div>
            {cfg.freeDeliveryAbove > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 8px',
                borderRadius: 999, background: '#d1fae5', color: '#065f46',
              }}>
                YOQILGAN
              </span>
            )}
          </div>
          <div className="stack">
            <div>
              <div className="label">Minimal summa (so&apos;m) — 0 = o&apos;chiq</div>
              <input className="input" type="number" value={cfg.freeDeliveryAbove}
                onChange={(e) => set('freeDeliveryAbove', e.target.value)}
                placeholder="Masalan: 150000" />
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              Yandex/Uzum kabi: buyurtma summasi bu chegaradan oshsa yetkazib berish bepul bo&apos;ladi.
              Checkout va mahsulotlar sahifasida progress bar ko&apos;rsatiladi.
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Commission */}
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Komissiya va servis</h3>
              <div className="card-sub">Platforma daromadi</div>
            </div>
          </div>
          <div className="stack">
            <div>
              <div className="label">Sotuvchi komissiyasi (%)</div>
              <input className="input" type="number" step="0.01"
                value={Math.round(cfg.commissionRate * 100)}
                onChange={(e) => set('commissionRate', String(parseFloat(e.target.value) / 100))} />
            </div>
            <div>
              <div className="label">Servis to&apos;lovi (%)</div>
              <input className="input" type="number" step="0.01"
                value={Math.round(cfg.serviceFeeRate * 100)}
                onChange={(e) => set('serviceFeeRate', String(parseFloat(e.target.value) / 100))} />
            </div>
          </div>
        </div>

        {/* Vehicle thresholds */}
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Transport chegaralari (kg)</h3>
              <div className="card-sub">Og&apos;irlik bo&apos;yicha transport tanlash</div>
            </div>
          </div>
          <div className="stack">
            <div>
              <div className="label">Velosipid max (kg)</div>
              <input className="input" type="number" value={cfg.bikeMaxKg}
                onChange={(e) => set('bikeMaxKg', e.target.value)} />
            </div>
            <div>
              <div className="label">Avto max (kg)</div>
              <input className="input" type="number" value={cfg.carMaxKg}
                onChange={(e) => set('carMaxKg', e.target.value)} />
            </div>
            <div>
              <div className="label">Furgon max (kg)</div>
              <input className="input" type="number" value={cfg.vanMaxKg}
                onChange={(e) => set('vanMaxKg', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="hstack" style={{ justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn ghost" onClick={() => window.location.reload()}>Bekor qilish</button>
        <button className="btn" onClick={save} disabled={saving}>
          {saving ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
}
