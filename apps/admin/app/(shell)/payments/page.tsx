'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, money, moneyK } from '@/lib/api';
import { IconCheck, IconMoney } from '@/components/admin/Icon';

/* ───────────────────── Types ────────────────────────────── */
interface Overview {
  gmv: number;
  gmvSubtotal: number;
  paidOrders: number;
  totalCommission: number;
  totalCourierFees: number;
  totalPlatformRevenue: number;
  pendingPayoutAmount: number;
  pendingPayoutCount: number;
  sellerOwed: number;
  courierOwed: number;
  todayCommission: number;
}

interface PayoutRow {
  id: string;
  payeeType: 'SELLER' | 'COURIER';
  payeeId: string;
  amount: string | number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  bankCardSnapshot: string | null;
  bankCardHolderSnapshot: string | null;
  rejectionReason: string | null;
  requestedAt: string;
  processedAt: string | null;
  payee: { displayName: string | null; fullName: string | null; phone: string | null };
}

interface SellerRow {
  id: string;
  brandName: string;
  legalName: string;
  fullName: string | null;
  phone: string | null;
  commissionRate: number;
  bankCardNumber: string | null;
  bankCardHolder: string | null;
  available: number;
  pending: number;
  paidOut: number;
}

interface PlatformConfig {
  id: string;
  commissionRate: string | number;
  serviceFeeRate: string | number;
  deliveryBaseFee: string | number;
  deliveryPerKmFee: string | number;
  courierBaseFee: string | number;
  courierPerKmFee: string | number;
  updatedAt: string;
}

/* ───────────────────── Icons ────────────────────────────── */
function IconClock({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
    </svg>
  );
}
function IconArrow({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
function IconUser({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconStore({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function IconScooter({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
      <path d="M5 17H3v-4l2-3h8l2 5" /><path d="M12 6l2 6" /><path d="M19 17h2v-3l-2-3" />
    </svg>
  );
}
function IconShield({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

/* ───────────────────── Sub-components ───────────────────── */
function Kpi({ label, value, Icon, sub }: {
  label: string; value: string;
  Icon: React.FC<{ size?: number }>; sub?: string;
}) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'var(--text)' }}>
          <Icon size={17} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const PAYOUT_STATUS_LABEL: Record<PayoutRow['status'], string> = {
  PENDING: 'Kutilmoqda',
  APPROVED: 'Tasdiqlangan',
  PAID: "To'landi",
  REJECTED: 'Rad etildi',
};

function PayoutStatusBadge({ status }: { status: PayoutRow['status'] }) {
  const colors: Record<PayoutRow['status'], { bg: string; fg: string }> = {
    PENDING: { bg: '#fef3c7', fg: '#92400e' },
    APPROVED: { bg: '#dbeafe', fg: '#1e40af' },
    PAID: { bg: '#d1fae5', fg: '#065f46' },
    REJECTED: { bg: '#fee2e2', fg: '#991b1b' },
  };
  const c = colors[status];
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
      background: c.bg, color: c.fg, display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {status === 'PAID' ? <IconCheck size={11} stroke={2.4} /> : <IconClock size={11} />}
      {PAYOUT_STATUS_LABEL[status]}
    </span>
  );
}

/* ───────────────────── Main ─────────────────────────────── */
type TabId = 'overview' | 'payouts' | 'sellers' | 'config';

export default function PaymentsPage() {
  const [tab, setTab] = useState<TabId>('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [sellers, setSellers] = useState<SellerRow[]>([]);
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED'>('');
  const [typeFilter, setTypeFilter] = useState<'' | 'SELLER' | 'COURIER'>('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('payeeType', typeFilter);
      const [ov, pl, sl, cfg] = await Promise.all([
        api<Overview>('/payouts/admin/overview'),
        api<PayoutRow[]>(`/payouts/admin/list?${params.toString()}`),
        api<SellerRow[]>('/payouts/admin/sellers'),
        api<PlatformConfig>('/payouts/admin/config'),
      ]);
      setOverview(ov);
      setPayouts(pl);
      setSellers(sl);
      setConfig(cfg);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const approve = async (id: string) => {
    await api(`/payouts/admin/${id}/approve`, { method: 'PATCH' });
    await loadAll();
  };
  const markPaid = async (id: string) => {
    await api(`/payouts/admin/${id}/paid`, { method: 'PATCH' });
    await loadAll();
  };
  const reject = async (id: string) => {
    const reason = window.prompt('Rad etish sababi:') ?? undefined;
    await api(`/payouts/admin/${id}/reject`, { method: 'PATCH', body: { reason } });
    await loadAll();
  };
  const setSellerCommission = async (id: string, current: number) => {
    const input = window.prompt('Yangi komissiya foizini kiriting (masalan 10):', String(current * 100));
    if (input === null) return;
    const rate = Number(input) / 100;
    if (!Number.isFinite(rate) || rate < 0 || rate > 0.5) {
      alert('Foiz 0–50 oralig`ida bo`lishi kerak');
      return;
    }
    await api(`/payouts/admin/sellers/${id}/commission`, {
      method: 'PATCH',
      body: { commissionRate: rate },
    });
    await loadAll();
  };
  const saveConfig = async (patch: Partial<Record<keyof PlatformConfig, number>>) => {
    await api('/payouts/admin/config', { method: 'PUT', body: patch });
    await loadAll();
  };

  const platformCount = overview ? overview.paidOrders : 0;
  const flowAmount = overview?.gmv ?? 0;
  const flowSeller = overview ? overview.gmvSubtotal - overview.totalCommission : 0;
  const flowCourier = overview?.totalCourierFees ?? 0;
  const flowPlatform = overview?.totalPlatformRevenue ?? 0;

  return (
    <div className="stack">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Pul aylanmasi</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Mijoz → Platforma → Sotuvchi → Kuryer · Yandex/Uzum modeli
          </p>
        </div>
        <button
          onClick={loadAll}
          style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
        >
          {loading ? 'Yuklanmoqda…' : 'Yangilash'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 10, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', borderRadius: 12, padding: 4, border: '1px solid var(--border)', marginBottom: 4, width: 'fit-content' }}>
        {([
          { id: 'overview', label: "Umumiy ko'rinish" },
          { id: 'payouts',  label: "To'lov so'rovlari" },
          { id: 'sellers',  label: 'Sotuvchilar' },
          { id: 'config',   label: 'Sozlamalar' },
        ] as { id: TabId; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none',
            background: tab === t.id ? 'var(--surface)' : 'transparent',
            color: tab === t.id ? 'var(--text)' : 'var(--text-muted)',
            fontWeight: tab === t.id ? 700 : 500, fontSize: 13,
            cursor: 'pointer', boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,.06)' : 'none',
            transition: 'all 160ms', whiteSpace: 'nowrap',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && overview && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 20 }}>
              Pul harakati zanjiri ({platformCount} ta to&apos;langan buyurtma)
            </div>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, overflowX: 'auto' }}>
              <FlowNode Icon={IconUser} label="Mijoz" amount={moneyK(flowAmount)} sub="Jami to'lov" />
              <FlowArrow label={`${moneyK(flowAmount)} so'm`} sub="Mahsulot + Yetkazib berish + Servis" />
              <FlowNode Icon={IconShield} label="Platforma" amount={moneyK(flowPlatform)} sub="Sof daromad" highlight />
              <FlowArrow label={`${moneyK(flowSeller)} so'm`} sub="Mahsulot − komissiya" />
              <FlowNode Icon={IconStore} label="Sotuvchi" amount={moneyK(flowSeller)} sub="To'lov" />
              <FlowArrow label={`${moneyK(flowCourier)} so'm`} sub="Yetkazib berish haqi" />
              <FlowNode Icon={IconScooter} label="Kuryer" amount={moneyK(flowCourier)} sub="Daromad" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            <Kpi label="GMV (jami)" value={moneyK(overview.gmv) + " so'm"} Icon={IconUser} sub={`${overview.paidOrders} ta buyurtma`} />
            <Kpi label="Komissiya" value={moneyK(overview.totalCommission) + " so'm"} Icon={IconMoney} sub={`Bugun: ${moneyK(overview.todayCommission)}`} />
            <Kpi label="Kuryerlarga" value={moneyK(overview.totalCourierFees) + " so'm"} Icon={IconScooter} sub="Yetkazib berish" />
            <Kpi label="Platforma sof" value={moneyK(overview.totalPlatformRevenue) + " so'm"} Icon={IconShield} sub="Komissiya + servis + delivery margin" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            <Kpi label="Sotuvchilarga qarz" value={money(overview.sellerOwed) + " so'm"} Icon={IconStore} sub="To'lash kutilmoqda" />
            <Kpi label="Kuryerlarga qarz" value={money(overview.courierOwed) + " so'm"} Icon={IconScooter} sub="Available balance" />
            <Kpi label="So'rovlardagi summa" value={money(overview.pendingPayoutAmount) + " so'm"} Icon={IconClock} sub={`${overview.pendingPayoutCount} ta payout`} />
          </div>
        </div>
      )}

      {/* PAYOUTS */}
      {tab === 'payouts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13 }}>
              <option value="">Barcha statuslar</option>
              <option value="PENDING">Kutilmoqda</option>
              <option value="APPROVED">Tasdiqlangan</option>
              <option value="PAID">To'landi</option>
              <option value="REJECTED">Rad etildi</option>
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as typeof typeFilter)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13 }}>
              <option value="">Barcha turlar</option>
              <option value="SELLER">Sotuvchilar</option>
              <option value="COURIER">Kuryerlar</option>
            </select>
          </div>

          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 1.5fr 0.9fr 1.1fr 0.9fr 1fr 1.1fr', padding: '12px 16px', background: 'var(--surface-2)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
              {['TUR', 'OLUVCHI', 'SUMMA', 'KARTA', 'STATUS', 'SO`RALGAN', 'AMAL'].map(h => <div key={h}>{h}</div>)}
            </div>
            {payouts.map((p, i) => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '0.7fr 1.5fr 0.9fr 1.1fr 0.9fr 1fr 1.1fr', padding: '14px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--border)', alignItems: 'center', fontSize: 13 }}>
                <div style={{ fontWeight: 600 }}>{p.payeeType === 'SELLER' ? 'Sotuvchi' : 'Kuryer'}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.payee.displayName ?? '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.payee.phone}</div>
                </div>
                <div style={{ fontWeight: 700 }}>{money(Number(p.amount))} so&apos;m</div>
                <div style={{ fontSize: 12 }}>
                  <div>{p.bankCardSnapshot ?? '—'}</div>
                  {p.bankCardHolderSnapshot && <div style={{ color: 'var(--text-muted)' }}>{p.bankCardHolderSnapshot}</div>}
                </div>
                <div><PayoutStatusBadge status={p.status} /></div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(p.requestedAt).toLocaleString()}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {p.status === 'PENDING' && (
                    <>
                      <button onClick={() => approve(p.id)} style={btnSmall('#dbeafe', '#1e40af')}>Tasdiq</button>
                      <button onClick={() => reject(p.id)} style={btnSmall('#fee2e2', '#991b1b')}>Rad</button>
                    </>
                  )}
                  {(p.status === 'PENDING' || p.status === 'APPROVED') && (
                    <button onClick={() => markPaid(p.id)} style={btnSmall('#d1fae5', '#065f46')}>To&apos;landi</button>
                  )}
                </div>
              </div>
            ))}
            {payouts.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                {loading ? 'Yuklanmoqda…' : "Hozircha to'lov so'rovlari yo'q"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SELLERS */}
      {tab === 'sellers' && (
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.8fr 1fr 1fr 1fr 0.7fr', padding: '12px 16px', background: 'var(--surface-2)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
            {['SOTUVCHI', 'TELEFON', "KOM'YA", 'AVAILABLE', 'PENDING', 'PAID OUT', 'AMAL'].map(h => <div key={h}>{h}</div>)}
          </div>
          {sellers.map((s, i) => (
            <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.8fr 1fr 1fr 1fr 0.7fr', padding: '14px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--border)', alignItems: 'center', fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{s.brandName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.legalName}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.phone ?? '—'}</div>
              <div style={{ fontWeight: 700 }}>{(Number(s.commissionRate) * 100).toFixed(1)}%</div>
              <div style={{ fontWeight: 700, color: '#065f46' }}>{money(s.available)}</div>
              <div style={{ color: '#92400e' }}>{money(s.pending)}</div>
              <div style={{ color: 'var(--text-muted)' }}>{money(s.paidOut)}</div>
              <div>
                <button onClick={() => setSellerCommission(s.id, Number(s.commissionRate))} style={btnSmall('#f3f4f6', '#374151')}>
                  Sozlash
                </button>
              </div>
            </div>
          ))}
          {sellers.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Sotuvchilar yo&apos;q</div>
          )}
        </div>
      )}

      {/* CONFIG */}
      {tab === 'config' && config && (
        <ConfigForm config={config} onSave={saveConfig} />
      )}
    </div>
  );
}

function btnSmall(bg: string, fg: string): React.CSSProperties {
  return {
    padding: '5px 10px', borderRadius: 6, border: 'none', background: bg, color: fg,
    fontSize: 11, fontWeight: 700, cursor: 'pointer',
  };
}

function ConfigForm({ config, onSave }: {
  config: PlatformConfig;
  onSave: (patch: Partial<Record<keyof PlatformConfig, number>>) => Promise<void>;
}) {
  const [draft, setDraft] = useState({
    commissionRate: Number(config.commissionRate) * 100,
    serviceFeeRate: Number(config.serviceFeeRate) * 100,
    deliveryBaseFee: Number(config.deliveryBaseFee),
    deliveryPerKmFee: Number(config.deliveryPerKmFee),
    courierBaseFee: Number(config.courierBaseFee),
    courierPerKmFee: Number(config.courierPerKmFee),
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    try {
      await onSave({
        commissionRate: draft.commissionRate / 100,
        serviceFeeRate: draft.serviceFeeRate / 100,
        deliveryBaseFee: draft.deliveryBaseFee,
        deliveryPerKmFee: draft.deliveryPerKmFee,
        courierBaseFee: draft.courierBaseFee,
        courierPerKmFee: draft.courierPerKmFee,
      });
      setSavedAt(new Date().toLocaleTimeString());
    } finally {
      setSaving(false);
    }
  };

  const fields: Array<[keyof typeof draft, string, string]> = [
    ['commissionRate', "Default komissiya (%)", "Sotuvchi mahsulot summasidan"],
    ['serviceFeeRate', "Servis to'lovi (%)", "Mijoz subtotal'dan"],
    ['deliveryBaseFee', "Delivery base (so'm)", "Mijoz to'laydigan boshlang'ich narx"],
    ['deliveryPerKmFee', "Delivery per km (so'm)", "Mijoz har km uchun"],
    ['courierBaseFee', "Courier base (so'm)", "Kuryer boshlang'ich daromadi"],
    ['courierPerKmFee', "Courier per km (so'm)", "Kuryer har km uchun"],
  ];

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 24, maxWidth: 720 }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Platforma sozlamalari</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Bu qiymatlar yangi buyurtmalarda ishlatiladi. Mavjud buyurtmalar snapshot qilingan stavkani saqlab qoladi.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {fields.map(([key, label, hint]) => (
          <label key={key} style={{ display: 'block' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>{label}</div>
            <input
              type="number"
              value={draft[key]}
              onChange={(e) => setDraft({ ...draft, [key]: Number(e.target.value) })}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 14,
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</div>
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: '#111827', color: '#fff', fontWeight: 700, fontSize: 14,
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
        {savedAt && (
          <span style={{ fontSize: 12, color: '#065f46' }}>Saqlandi · {savedAt}</span>
        )}
      </div>
    </div>
  );
}

/* ───────────────────── Flow diagram ─────────────────────── */
function FlowNode({ Icon, label, amount, sub, highlight }: {
  Icon: React.FC<{ size?: number }>;
  label: string; amount: string; sub: string; highlight?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      padding: '16px 20px', borderRadius: 14,
      background: highlight ? 'var(--text)' : 'var(--surface-2)',
      border: `1px solid ${highlight ? 'var(--text)' : 'var(--border)'}`,
      color: highlight ? '#fff' : 'var(--text)',
      minWidth: 120, flexShrink: 0,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: highlight ? 'rgba(255,255,255,.15)' : 'var(--surface)', border: `1px solid ${highlight ? 'rgba(255,255,255,.2)' : 'var(--border)'}`, display: 'grid', placeItems: 'center', color: highlight ? '#fff' : 'var(--text)' }}>
        <Icon size={18} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: highlight ? 'rgba(255,255,255,.7)' : 'var(--text-muted)', letterSpacing: '0.3px' }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px' }}>{amount}</div>
      <div style={{ fontSize: 11, color: highlight ? 'rgba(255,255,255,.6)' : 'var(--text-muted)', textAlign: 'center' }}>{sub}</div>
    </div>
  );
}

function FlowArrow({ label, sub }: { label: string; sub: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minWidth: 80, gap: 4, padding: '0 8px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>{label}</div>
      <div style={{ color: 'var(--text-muted)' }}><IconArrow size={20} /></div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>{sub}</div>
    </div>
  );
}

// silence the imported but unused symbol when overview isn't loaded
void useMemo;
