'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';

type Notif = {
  id: string;
  type: 'order' | 'promo' | 'system';
  title: string;
  body: string;
  time: string;
  read: boolean;
  icon: string;
};

const DEMO: Notif[] = [
  { id: 'n1', type: 'order', title: 'Buyurtma yetkazildi!', body: "ORD-128 buyurtmangiz yetkazib berildi. Xaridingiz uchun rahmat!", time: '14:32', read: false, icon: '✅' },
  { id: 'n2', type: 'order', title: 'Kuryer yo\'lda', body: "Jasur siz tomon ketmoqda. Taxminiy vaqt: 12 daqiqa.", time: '14:18', read: false, icon: '🛵' },
  { id: 'n3', type: 'promo', title: '20% chegirma!', body: "Bugun kechgacha Toshkent Nonvoyxonasidan buyurtma bering, 20% chegirmadan foydalaning.", time: '12:00', read: false, icon: '🎁' },
  { id: 'n4', type: 'order', title: 'Buyurtma qabul qilindi', body: "ORD-128 buyurtmangiz restoran tomonidan qabul qilindi.", time: 'Kecha 19:45', read: true, icon: '🏪' },
  { id: 'n5', type: 'order', title: 'Buyurtma bekor qilindi', body: "ORD-124 buyurtmangiz bekor qilindi. Pul qaytariladi.", time: 'Kecha 15:30', read: true, icon: '❌' },
  { id: 'n6', type: 'promo', title: 'Yangi restoran ochildi!', body: "Sushi Art endi Lochin platformasida. Birinchi buyurtmada 15% chegirma.", time: '25 Apr', read: true, icon: '🍣' },
  { id: 'n7', type: 'system', title: "Ilovani yangilang", body: "Lochin 2.1 versiyasi mavjud. Yangi xususiyatlar va tezroq ishlash.", time: '24 Apr', read: true, icon: '🔄' },
  { id: 'n8', type: 'promo', title: 'Do\'stingizni taklif qiling', body: "Har bir do'st uchun 5,000 so'm bonus oling. Referal kodingiz: JASUR123", time: '23 Apr', read: true, icon: '🎉' },
];

const TYPE_COLOR: Record<string, string> = {
  order: 'var(--primary-50)',
  promo: '#fef3c7',
  system: 'var(--surface-2)',
};

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
    <div style={{ background: 'var(--canvas)', minHeight: '100dvh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, #1e1b4b 0%, #4f46e5 100%)',
        padding: '48px 20px 20px',
        paddingTop: 'max(48px, calc(env(safe-area-inset-top) + 20px))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 2 }}>Bildirishnomalar</h1>
            {unreadCount > 0 && (
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>{unreadCount} ta o'qilmagan</div>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10,
              color: '#fff', padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
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
          background: 'var(--surface-2)', borderRadius: 12, padding: 4,
        }}>
          {([['all', 'Barchasi'], ['unread', "O'qilmagan"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              flex: 1, padding: '8px 0', borderRadius: 9, border: 'none',
              background: filter === k ? '#fff' : 'transparent',
              color: filter === k ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: filter === k ? 700 : 500, fontSize: 13, cursor: 'pointer',
              boxShadow: filter === k ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
              transition: 'all 200ms',
            }}>
              {l}{k === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
            </button>
          ))}
        </div>

        {/* Notification list */}
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Bildirishnomalar yo'q</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map(n => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                style={{
                  background: n.read ? 'var(--surface)' : 'var(--primary-50)',
                  borderRadius: 16, padding: '14px 16px',
                  border: `1px solid ${n.read ? 'var(--border)' : 'rgba(79,70,229,0.2)'}`,
                  display: 'flex', gap: 14, cursor: 'pointer',
                  transition: 'background 200ms',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: TYPE_COLOR[n.type],
                  display: 'grid', placeItems: 'center', fontSize: 20,
                }}>
                  {n.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                    <div style={{
                      fontWeight: n.read ? 600 : 800, fontSize: 14,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{n.time}</div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.body}</div>
                </div>
                {!n.read && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--primary)', flexShrink: 0, marginTop: 4,
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
