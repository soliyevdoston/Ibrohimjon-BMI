'use client';
import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/Sidebar';
import { IconCheck, IconMoney } from '@/components/admin/Icon';

const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(n));
const K = (n: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(n / 1000)) + 'K';

function IconClock({ size = 20, stroke = 1.75 }: { size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
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

/* ─── Data ─────────────────────────────────────────────────── */
type SellerTx = {
  id: string; date: string; seller: string; orderTotal: number;
  commission: number; payout: number; orders: number;
  status: 'paid' | 'pending' | 'processing'; method: string;
};

type CourierTx = {
  id: string; date: string; courier: string; deliveries: number;
  earned: number; status: 'paid' | 'pending';
};

const SELLER_TX: SellerTx[] = [
  { id: 'TX-001', date: '27 Apr, 14:32', seller: 'Toshkent Nonvoyxonasi', orderTotal: 3_240_000, commission: 259_200, payout: 2_980_800, orders: 48, status: 'paid',       method: 'Uzcard' },
  { id: 'TX-002', date: '27 Apr, 12:11', seller: "Samarqand Go'shti",     orderTotal: 1_870_000, commission: 149_600, payout: 1_720_400, orders: 31, status: 'paid',       method: 'Humo' },
  { id: 'TX-003', date: '27 Apr, 10:05', seller: "Farida's Kitchen",      orderTotal: 2_510_000, commission: 200_800, payout: 2_309_200, orders: 39, status: 'processing', method: 'Uzcard' },
  { id: 'TX-004', date: '26 Apr, 18:45', seller: 'DonerLand',             orderTotal: 980_000,   commission: 78_400,  payout: 901_600,   orders: 17, status: 'pending',    method: 'Uzcard' },
  { id: 'TX-005', date: '26 Apr, 16:20', seller: 'Fresh Market',          orderTotal: 4_120_000, commission: 329_600, payout: 3_790_400, orders: 63, status: 'paid',       method: 'Humo' },
  { id: 'TX-006', date: '26 Apr, 13:55', seller: 'Plov Usta',             orderTotal: 1_340_000, commission: 107_200, payout: 1_232_800, orders: 22, status: 'paid',       method: 'Uzcard' },
  { id: 'TX-007', date: '25 Apr, 19:30', seller: 'Burger House',          orderTotal: 2_780_000, commission: 222_400, payout: 2_557_600, orders: 44, status: 'pending',    method: 'Uzcard' },
  { id: 'TX-008', date: '25 Apr, 17:00', seller: 'Sushi Art',             orderTotal: 5_900_000, commission: 472_000, payout: 5_428_000, orders: 71, status: 'paid',       method: 'Humo' },
];

const COURIER_TX: CourierTx[] = [
  { id: 'CR-001', date: '27 Apr', courier: 'Jasur Toshmatov',   deliveries: 14, earned: 196_000, status: 'paid' },
  { id: 'CR-002', date: '27 Apr', courier: 'Bekzod Alimov',     deliveries: 11, earned: 154_000, status: 'paid' },
  { id: 'CR-003', date: '27 Apr', courier: 'Sanjar Yusupov',    deliveries: 9,  earned: 126_000, status: 'pending' },
  { id: 'CR-004', date: '26 Apr', courier: 'Dilshod Karimov',   deliveries: 17, earned: 238_000, status: 'paid' },
  { id: 'CR-005', date: '26 Apr', courier: 'Mirzo Hasanov',     deliveries: 6,  earned: 84_000,  status: 'pending' },
  { id: 'CR-006', date: '25 Apr', courier: 'Firdavs Ergashev',  deliveries: 19, earned: 266_000, status: 'paid' },
];

const STATUS_LABEL: Record<string, string> = { paid: "To'landi", pending: 'Kutilmoqda', processing: 'Jarayonda' };
const COMMISSION_RATE = 8; // %
const DELIVERY_FEE_PER_ORDER = 14_000;

/* ─── Computed summaries ─────────────────────────────────── */
const totalCustomerPaid    = SELLER_TX.reduce((s, t) => s + t.orderTotal + t.orders * DELIVERY_FEE_PER_ORDER, 0);
const totalSellerPayout    = SELLER_TX.reduce((s, t) => s + t.payout, 0);
const totalCommission      = SELLER_TX.reduce((s, t) => s + t.commission, 0);
const totalDeliveryRevenue = SELLER_TX.reduce((s, t) => s + t.orders * DELIVERY_FEE_PER_ORDER, 0);
const totalCourierPayout   = COURIER_TX.reduce((s, t) => s + t.earned, 0);
const platformNet          = totalCommission + totalDeliveryRevenue - totalCourierPayout;

const methodBreakdown = [
  { label: 'Naqd pul', pct: 34, amount: Math.round(totalCustomerPaid * 0.34) },
  { label: 'Karta',    pct: 28, amount: Math.round(totalCustomerPaid * 0.28) },
  { label: 'Payme',    pct: 22, amount: Math.round(totalCustomerPaid * 0.22) },
  { label: 'Click',    pct: 16, amount: Math.round(totalCustomerPaid * 0.16) },
];

/* ─── Sub-components ────────────────────────────────────── */
function Kpi({ label, value, Icon, sub }: { label: string; value: string; Icon: React.FC<{ size?: number; stroke?: number }>; sub?: string }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'var(--text)' }}>
          <Icon size={17} stroke={1.7} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {status === 'paid' ? <IconCheck size={11} stroke={2.4} /> : <IconClock size={11} stroke={1.8} />}
      {STATUS_LABEL[status]}
    </span>
  );
}

type TabId = 'overview' | 'sellers' | 'couriers';

export default function PaymentsPage() {
  const [tab, setTab] = useState<TabId>('overview');
  const [sellerFilter, setSellerFilter] = useState<'all' | 'paid' | 'pending' | 'processing'>('all');
  const [sellerSearch, setSellerSearch] = useState('');
  const [courierFilter, setCourierFilter] = useState<'all' | 'paid' | 'pending'>('all');

  const sellerList = SELLER_TX
    .filter(t => sellerFilter === 'all' || t.status === sellerFilter)
    .filter(t => !sellerSearch || t.seller.toLowerCase().includes(sellerSearch.toLowerCase()) || t.id.toLowerCase().includes(sellerSearch.toLowerCase()));

  const courierList = COURIER_TX
    .filter(t => courierFilter === 'all' || t.status === courierFilter);

  return (
    <div className="layout">
      <AdminSidebar />
      <main className="main">
        <div className="page">
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Pul aylanmasi</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Mijoz → Platforma → Sotuvchi → Kuryer to'lov zanjiri</p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', borderRadius: 12, padding: 4, border: '1px solid var(--border)', marginBottom: 28, width: 'fit-content' }}>
            {([
              { id: 'overview', label: "Umumiy ko'rinish" },
              { id: 'sellers',  label: 'Sotuvchilar' },
              { id: 'couriers', label: 'Kuryerlar' },
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

          {/* ======= OVERVIEW TAB ======= */}
          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Money flow diagram */}
              <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 20 }}>
                  Pul harakati zanjiri
                </div>
                <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, overflowX: 'auto' }}>
                  {/* Customer */}
                  <FlowNode Icon={IconUser} label="Mijoz" amount={K(totalCustomerPaid)} sub="Jami to'lov" />
                  <FlowArrow label={`${K(totalCustomerPaid)} so'm`} sub="Tovar + yetkazish" />
                  {/* Platform */}
                  <FlowNode Icon={IconShield} label="Platforma" amount={K(platformNet)} sub="Sof foyda" highlight />
                  <FlowArrow label={`${K(totalSellerPayout)} so'm`} sub={`Komissiya chegirib: ${COMMISSION_RATE}%`} />
                  {/* Seller */}
                  <FlowNode Icon={IconStore} label="Sotuvchi" amount={K(totalSellerPayout)} sub="To'lov" />
                  <FlowArrow label={`${K(totalCourierPayout)} so'm`} sub="Yetkazish haqqi" />
                  {/* Courier */}
                  <FlowNode Icon={IconScooter} label="Kuryer" amount={K(totalCourierPayout)} sub="Daromad" />
                </div>
              </div>

              {/* Summary KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                <Kpi label="Mijozlar to'ladi" value={K(totalCustomerPaid) + " so'm"} Icon={IconUser} sub="Tovar + yetkazish" />
                <Kpi label="Sotuvchilarga"    value={K(totalSellerPayout) + " so'm"} Icon={IconStore} sub="Komissiya chiqarilgan" />
                <Kpi label="Kuryerlarga"      value={K(totalCourierPayout) + " so'm"} Icon={IconScooter} sub="Yetkazish haqqi" />
                <Kpi label="Platforma foydasi" value={K(platformNet) + " so'm"} Icon={IconShield} sub={`Komissiya (${COMMISSION_RATE}%) + yetkazish`} />
              </div>

              {/* Commission breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Commission rate card */}
                <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>
                    Komissiya tarkibi
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: 'Savdo komissiyasi', value: COMMISSION_RATE + '%', amount: K(totalCommission) },
                      { label: "Yetkazish to'lovi",  value: K(DELIVERY_FEE_PER_ORDER) + ' / buyurtma', amount: K(totalDeliveryRevenue) },
                      { label: "Kuryer to'lovi",     value: '−' + K(totalCourierPayout), amount: '−' + K(totalCourierPayout) },
                    ].map((row, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{row.label}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.value}</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{row.amount} so'm</div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '2px solid var(--border)' }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>Sof foyda</div>
                      <div style={{ fontSize: 16, fontWeight: 800 }}>{K(platformNet)} so'm</div>
                    </div>
                  </div>
                </div>

                {/* Payment methods breakdown */}
                <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>
                    To'lov usullari
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {methodBreakdown.map((m) => (
                      <div key={m.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13, fontWeight: 600 }}>
                          <span>{m.label}</span>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{m.pct}% · {K(m.amount)} so'm</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: m.pct + '%', background: 'var(--text)', borderRadius: 4, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======= SELLERS TAB ======= */}
          {tab === 'sellers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <Kpi label="To'landi"    value={K(SELLER_TX.filter(t => t.status === 'paid').reduce((s, t) => s + t.payout, 0)) + " so'm"} Icon={IconCheck} />
                <Kpi label="Kutilmoqda" value={K(SELLER_TX.filter(t => t.status !== 'paid').reduce((s, t) => s + t.payout, 0)) + " so'm"} Icon={IconClock} />
                <Kpi label="Komissiya"  value={K(totalCommission) + " so'm"} Icon={IconMoney} sub={COMMISSION_RATE + '% stavka'} />
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <input className="input" placeholder="Sotuvchi nomi yoki ID…" value={sellerSearch} onChange={e => setSellerSearch(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', borderRadius: 12, padding: 4, border: '1px solid var(--border)' }}>
                  {(['all', 'paid', 'pending', 'processing'] as const).map(f => (
                    <button key={f} onClick={() => setSellerFilter(f)} style={{
                      padding: '7px 14px', borderRadius: 8, border: 'none',
                      background: sellerFilter === f ? 'var(--surface)' : 'transparent',
                      color: sellerFilter === f ? 'var(--text)' : 'var(--text-muted)',
                      fontWeight: sellerFilter === f ? 700 : 500, fontSize: 13,
                      cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 160ms',
                    }}>
                      {f === 'all' ? 'Barchasi' : STATUS_LABEL[f]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.4fr 1fr 0.8fr 0.7fr 0.7fr 0.8fr 0.9fr', padding: '12px 16px', background: 'var(--surface-2)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                  {['ID', 'SOTUVCHI', 'BUYURTMA JAMI', "KOM'YA (8%)", "TO'LOV", 'BUYURTMA', 'STATUS', 'SANA'].map(h => <div key={h}>{h}</div>)}
                </div>
                {sellerList.map((tx, i) => (
                  <div key={tx.id} style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.4fr 1fr 0.8fr 0.7fr 0.7fr 0.8fr 0.9fr', padding: '14px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--border)', alignItems: 'center', fontSize: 13 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 12 }}>{tx.id}</div>
                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.seller}</div>
                    <div style={{ fontWeight: 600 }}>{K(tx.orderTotal)}</div>
                    <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>−{K(tx.commission)}</div>
                    <div style={{ fontWeight: 700 }}>{K(tx.payout)}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{tx.orders} ta</div>
                    <div><StatusBadge status={tx.status} /></div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{tx.date}</div>
                  </div>
                ))}
                {sellerList.length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Hech narsa topilmadi</div>
                )}
              </div>
            </div>
          )}

          {/* ======= COURIERS TAB ======= */}
          {tab === 'couriers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <Kpi label="To'landi"         value={K(COURIER_TX.filter(t => t.status === 'paid').reduce((s, t) => s + t.earned, 0)) + " so'm"} Icon={IconCheck} />
                <Kpi label="Kutilmoqda"       value={K(COURIER_TX.filter(t => t.status === 'pending').reduce((s, t) => s + t.earned, 0)) + " so'm"} Icon={IconClock} />
                <Kpi label="Jami yetkazishlar" value={fmt(COURIER_TX.reduce((s, t) => s + t.deliveries, 0)) + ' ta'} Icon={IconScooter} sub="Bugungi kun" />
              </div>

              {/* Filter */}
              <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', borderRadius: 12, padding: 4, border: '1px solid var(--border)', width: 'fit-content' }}>
                {(['all', 'paid', 'pending'] as const).map(f => (
                  <button key={f} onClick={() => setCourierFilter(f)} style={{
                    padding: '7px 16px', borderRadius: 8, border: 'none',
                    background: courierFilter === f ? 'var(--surface)' : 'transparent',
                    color: courierFilter === f ? 'var(--text)' : 'var(--text-muted)',
                    fontWeight: courierFilter === f ? 700 : 500, fontSize: 13,
                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 160ms',
                  }}>
                    {f === 'all' ? 'Barchasi' : STATUS_LABEL[f]}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.6fr 0.8fr 1fr 0.9fr 1fr', padding: '12px 16px', background: 'var(--surface-2)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                  {['ID', 'KURYER', 'YETKAZISH', "DAROMAD", 'STATUS', 'SANA'].map(h => <div key={h}>{h}</div>)}
                </div>
                {courierList.map((tx, i) => (
                  <div key={tx.id} style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.6fr 0.8fr 1fr 0.9fr 1fr', padding: '14px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--border)', alignItems: 'center', fontSize: 13 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 12 }}>{tx.id}</div>
                    <div style={{ fontWeight: 600 }}>{tx.courier}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{tx.deliveries} ta</div>
                    <div style={{ fontWeight: 700 }}>{K(tx.earned)} so'm</div>
                    <div><StatusBadge status={tx.status} /></div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{tx.date}</div>
                  </div>
                ))}
                {courierList.length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Hech narsa topilmadi</div>
                )}
              </div>

              {/* Per-delivery fee info */}
              <div style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text)' }}><IconScooter size={16} /></span>
                Har bir muvaffaqiyatli yetkazish uchun kuryer <strong style={{ color: 'var(--text)' }}>14 000 so'm</strong> oladi.
                Haftasiga bir marta hisobga o&apos;tkaziladi.
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ─── Flow diagram helpers ──────────────────────────────── */
function FlowNode({ Icon, label, amount, sub, highlight }: {
  Icon: React.FC<{ size?: number }>;
  label: string;
  amount: string;
  sub: string;
  highlight?: boolean;
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
