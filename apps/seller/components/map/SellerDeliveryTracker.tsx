'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const Map = dynamic(() => import('./SellerDeliveryTrackerMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '100%',
      display: 'grid',
      placeItems: 'center',
      background: 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 55%, #ecfeff 100%)',
    }}>
      <div style={{ textAlign: 'center', color: '#8a94a6' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
        <div style={{ fontSize: 14 }}>Xarita yuklanmoqda…</div>
      </div>
    </div>
  ),
});

type Props = {
  open: boolean;
  onClose: () => void;
  orderCode: string;
  customerName: string;
  deliveryId: string;
  sellerPos: [number, number];
  customerPos: [number, number];
  initialCourierPos?: [number, number] | null;
};

export function SellerDeliveryTracker({
  open,
  onClose,
  orderCode,
  customerName,
  deliveryId,
  sellerPos,
  customerPos,
  initialCourierPos = null,
}: Props) {
  const [courierPos, setCourierPos] = useState<[number, number] | null>(initialCourierPos);
  const [wsConnected, setWsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';

    // Try real WebSocket first
    try {
      const socket = io(`${process.env.NEXT_PUBLIC_WS_URL || 'https://ibrohimjon-bmi.onrender.com'}/realtime`, {
        auth: { token },
        transports: ['websocket'],
        reconnectionDelay: 2000,
        timeout: 5000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setWsConnected(true);
        socket.emit('delivery:join', { deliveryId });
      });

      socket.on('delivery:location', (payload: { lat: number; lng: number }) => {
        setCourierPos([payload.lat, payload.lng]);
      });

      socket.on('connect_error', () => setWsConnected(false));
      socket.on('disconnect', () => setWsConnected(false));
    } catch {/* fall through to simulation */}

    // Simulation fallback: courier walks from seller toward customer
    let step = 0;
    const total = 80;
    simRef.current = setInterval(() => {
      if (wsConnected) return;
      const t = Math.min(step / total, 1);
      const lat = sellerPos[0] + (customerPos[0] - sellerPos[0]) * t + (Math.random() - 0.5) * 0.0004;
      const lng = sellerPos[1] + (customerPos[1] - sellerPos[1]) * t + (Math.random() - 0.5) * 0.0004;
      setCourierPos([lat, lng]);
      step++;
      if (step >= total) step = 0;
    }, 2500);

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      if (simRef.current) clearInterval(simRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, deliveryId]);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(15,23,42,0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 1100,
          height: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Yetkazib berish kuzatuvi · {orderCode}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              Mijoz: {customerName}
              <span style={{
                marginLeft: 12,
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                background: wsConnected ? '#d1fae5' : '#fef3c7',
                color: wsConnected ? '#065f46' : '#92400e',
              }}>
                {wsConnected ? '● Live' : '○ Simulated'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: '#f3f4f6',
              width: 36,
              height: 36,
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 18,
              fontWeight: 700,
              color: '#374151',
            }}
            aria-label="Yopish"
          >
            ✕
          </button>
        </div>

        {/* Map */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <Map sellerPos={sellerPos} courierPos={courierPos} customerPos={customerPos} />
        </div>
      </div>
    </div>
  );
}
