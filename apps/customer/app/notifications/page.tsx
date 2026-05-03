'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import {
  IconCheck, IconX, IconBell, IconStore, IconScooter,
  IconGift, IconRefresh, IconUtensils, IconSparkle,
} from '@/components/Icons';

type IconCmp = React.ComponentType<{ size?: number; stroke?: number; style?: React.CSSProperties }>;

type Notif = {
  id: string;
  type: 'order' | 'promo' | 'system';
  title: string;
  body: string;
  time: string;
  read: boolean;
  Icon: IconCmp;
};

const DEMO: Notif[] = [
  { id: 'n1', type: 'order', title: 'Buyurtma yetkazildi', body: "ORD-128 buyurtmangiz yetkazib berildi. Xaridingiz uchun rahmat!", time: '14:32', read: false, Icon: IconCheck },
  { id: 'n2', type: 'order', title: "Kuryer yo'lda", body: 'Jasur siz tomon ketmoqda. Taxminiy vaqt: 12 daqiqa.', time: '14:18', read: false, Icon: IconScooter },
  { id: 'n3', type: 'promo', title: '20% chegirma', body: 'Bugun kechgacha Toshkent Nonvoyxonasidan buyurtma bering, 20% chegirmadan foydalaning.', time: '12:00', read: false, Icon: IconGift },
  { id: 'n4', type: 'order', title: 'Buyurtma qabul qilindi', body: 'ORD-128 buyurtmangiz restoran tomonidan qabul qilindi.', time: 'Kecha 19:45', read: true, Icon: IconStore },
  { id: 'n5', type: 'order', title: 'Buyurtma bekor qilindi', body: 'ORD-124 buyurtmangiz bekor qilindi. Pul qaytariladi.', time: 'Kecha 15:30', read: true, Icon: IconX },
  { id: 'n6', type: 'promo', title: 'Yangi restoran ochildi', body: 'Sushi Art endi Lochin platformasida. Birinchi buyurtmada 15% chegirma.', time: '25 Apr', read: true, Icon: IconUtensils },
  { id: 'n7', type: 'system', title: 'Ilovani yangilang', body: 'Lochin 2.1 versiyasi mavjud. Yangi xususiyatlar va tezroq ishlash.', time: '24 Apr', read: true, Icon: IconRefresh },
  { id: 'n8', type: 'promo', title: "Do'stingizni taklif qiling", body: "Har bir do'st uchun 5,000 so'm bonus oling. Referal kodingiz: JASUR123", time: '23 Apr', read: true, Icon: IconSparkle },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notif[]>(DEMO);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { router.replace('/login'); return; }
  }, [router]);

  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: string) => setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const list = filter === 'unread' ? items.filter(n => !n.read) : items;
  const unreadCount = items.filter(n => !n.read).length;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '32px 20px 16px',
        paddingTop: 'max(32px, calc(env(safe-area-inset-top) + 16px))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ color: 'var(--text)', fontSize: 22, fontWeight: 800, marginBottom: 2, letterSpacing: '-0.3px' }}>Bildirishnomalar</h1>
            {unreadCount > 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{unreadCount} ta o'qilmagan</div>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{
              background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 10,
              color: 'var(--text)', padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              Barchasini o'qish
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Filter tabs */}
        <div style={{
          display: 'flex', gap: 8, marginBottom: 16,
          background: 'var(--surface-alt)', borderRadius: 12, padding: 4,
        }}>
          {([['all', 'Barchasi'], ['unread', "O'qilmagan"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              flex: 1, padding: '8px 0', borderRadius: 9, border: 'none',
              background: filter === k ? 'var(--surface)' : 'transparent',
              color: filter === k ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: filter === k ? 700 : 500, fontSize: 13, cursor: 'pointer',
              boxShadow: filter === k ? '0 1px 3px rgba(0,0,0,.06)' : 'none',
              transition: 'all 200ms',
            }}>
              {l}{k === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
            </button>
          ))}
        </div>

        {/* Notification list */}
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ display: 'inline-flex', padding: 16, borderRadius: 16, border: '1px solid var(--border)', marginBottom: 12, color: 'var(--text-muted)' }}>
              <IconBell size={28} stroke={1.5} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Bildirishnomalar yo'q</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map(n => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 14, padding: '14px 16px',
                  border: '1px solid var(--border)',
                  display: 'flex', gap: 14, cursor: 'pointer',
                  transition: 'background 200ms',
                  position: 'relative',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  display: 'grid', placeItems: 'center',
                  color: 'var(--text)',
                }}>
                  <n.Icon size={18} stroke={1.7} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                    <div style={{
                      fontWeight: n.read ? 600 : 800, fontSize: 14,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: 'var(--text)',
                    }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, fontWeight: 500 }}>{n.time}</div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{n.body}</div>
                </div>
                {!n.read && (
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--text)', flexShrink: 0,
                    position: 'absolute', top: 18, right: 18,
                  }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
