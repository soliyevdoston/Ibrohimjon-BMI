'use client';
import { useEffect, useState } from 'react';

type Activity = {
  id: string;
  type: 'order' | 'courier' | 'delivery' | 'seller' | 'customer' | 'payment';
  title: string;
  detail: string;
  ts: number;
};

const TYPE_META: Record<Activity['type'], { emoji: string; tone: string }> = {
  order:    { emoji: '🛒', tone: '#4f46e5' },
  courier:  { emoji: '🛵', tone: '#f59e0b' },
  delivery: { emoji: '✅', tone: '#10b981' },
  seller:   { emoji: '🏪', tone: '#0ea5e9' },
  customer: { emoji: '👤', tone: '#8b5cf6' },
  payment:  { emoji: '💳', tone: '#06b6d4' },
};

const SAMPLE_EVENTS: Omit<Activity, 'id' | 'ts'>[] = [
  { type: 'order',    title: 'Yangi buyurtma', detail: 'ORD-1042 · Aziza K. · 142 000 soʼm' },
  { type: 'courier',  title: 'Kuryer onlayn', detail: 'Jasur T. ish boshladi · Yunusobod' },
  { type: 'delivery', title: 'Yetkazib berildi', detail: 'ORD-1038 · 24 daqiqada · Chilonzor' },
  { type: 'order',    title: 'Yangi buyurtma', detail: 'ORD-1041 · Bekzod A. · 87 500 soʼm' },
  { type: 'payment',  title: 'Toʼlov qabul qilindi', detail: 'ORD-1040 · Click toʼlovi · 198 000 soʼm' },
  { type: 'seller',   title: 'Sotuvchi qoʼshildi', detail: 'Bro Coffee · Yakkasaroy filiali' },
  { type: 'courier',  title: 'Kuryer band', detail: 'Sherzod M. ORD-1039 ni qabul qildi' },
  { type: 'delivery', title: 'Yetkazib berildi', detail: 'ORD-1037 · 18 daqiqada · Mirzo Ulugʼbek' },
  { type: 'customer', title: 'Yangi mijoz', detail: 'Madina S. roʼyxatdan oʼtdi' },
  { type: 'order',    title: 'Yangi buyurtma', detail: 'ORD-1043 · Otabek U. · 36 000 soʼm' },
  { type: 'payment',  title: 'Naqd toʼlov', detail: 'ORD-1036 · 145 000 soʼm · kuryer qabul qildi' },
  { type: 'delivery', title: 'Yetkazib berildi', detail: 'ORD-1035 · 31 daqiqada · Olmazor' },
  { type: 'order',    title: 'Yangi buyurtma', detail: 'ORD-1044 · Dilnoza Y. · 64 000 soʼm' },
  { type: 'courier',  title: 'Kuryer dam olishda', detail: 'Aziz R. tushlik tanaffusida · 15 daqiqa' },
  { type: 'seller',   title: 'Mahsulot tasdiqlandi', detail: '"Cheesecake" · Lochin Market' },
];

let nextId = 1;
const genId = () => `act-${nextId++}-${Math.random().toString(36).slice(2, 6)}`;

function timeAgoShort(ts: number): string {
  const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (sec < 60) return `${sec} soniya oldin`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} daqiqa oldin`;
  const h = Math.floor(min / 60);
  return `${h} soat oldin`;
}

export function ActivityFeed({ height = 380 }: { height?: number }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    const seedNow = Date.now();
    const seeded: Activity[] = SAMPLE_EVENTS.slice(0, 6).map((e, i) => ({
      ...e,
      id: genId(),
      ts: seedNow - i * 90_000,
    }));
    setActivities(seeded);

    const addInterval = setInterval(() => {
      setActivities((prev) => {
        const tpl = SAMPLE_EVENTS[Math.floor(Math.random() * SAMPLE_EVENTS.length)];
        const next: Activity = { ...tpl, id: genId(), ts: Date.now() };
        return [next, ...prev].slice(0, 30);
      });
    }, 6000);

    const tickInterval = setInterval(() => setTick((t) => t + 1), 15_000);

    return () => {
      clearInterval(addInterval);
      clearInterval(tickInterval);
    };
  }, []);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="card-h" style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
        <div>
          <h3>Jonli faollik</h3>
          <div className="card-sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 8, height: 8, borderRadius: 999,
              background: '#10b981',
              boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',
              animation: 'livePulse 1.6s ease-in-out infinite',
            }} />
            Real vaqtda yangilanadi
          </div>
        </div>
      </div>

      <div style={{ overflowY: 'auto', height, padding: '8px 0' }}>
        {activities.map((a, i) => {
          const meta = TYPE_META[a.type];
          return (
            <div
              key={a.id}
              style={{
                display: 'flex',
                gap: 12,
                padding: '12px 18px',
                borderBottom: i < activities.length - 1 ? '1px solid var(--border)' : 'none',
                animation: i === 0 ? 'feedSlideIn 380ms ease' : 'none',
              }}
            >
              <div style={{
                width: 38, height: 38,
                borderRadius: 12,
                flexShrink: 0,
                background: `${meta.tone}15`,
                color: meta.tone,
                border: `1px solid ${meta.tone}30`,
                display: 'grid',
                placeItems: 'center',
                fontSize: 18,
              }}>{meta.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 2,
                }}>
                  <strong style={{ fontSize: 13, color: 'var(--text)' }}>{a.title}</strong>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {timeAgoShort(a.ts)}
                  </span>
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>{a.detail}</div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes livePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.3); opacity: 0.7; }
        }
        @keyframes feedSlideIn {
          from { opacity: 0; transform: translateY(-8px); background: rgba(99, 102, 241, 0.08); }
          to   { opacity: 1; transform: translateY(0); background: transparent; }
        }
      `}</style>
    </div>
  );
}
