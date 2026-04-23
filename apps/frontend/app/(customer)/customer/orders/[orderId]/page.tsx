'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MapPreview } from '@/components/MapPreview';
import { Timeline } from '@/components/Timeline';
import { getSocket } from '@/lib/socket';
import { useTrackingStore } from '@/stores/tracking-store';

const statuses = ['PENDING', 'PREPARING', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED'];

export default function OrderTrackingPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params?.orderId ?? 'demo';
  const { etaMinutes, marker, setTracking } = useTrackingStore();

  useEffect(() => {
    const socket = getSocket();
    socket.emit('order:join', { orderId });
    socket.emit('delivery:join', { deliveryId: orderId });

    const onLocation = (payload: { lat: number; lng: number }) => {
      const x = Math.max(10, Math.min(90, 20 + payload.lng % 60));
      const y = Math.max(10, Math.min(90, 20 + payload.lat % 60));
      setTracking({ marker: { x, y } });
    };

    const onOrderStatus = (payload: { status: string }) => {
      const nextStep = statuses.indexOf(payload.status);
      if (nextStep >= 0) {
        setTracking({ etaMinutes: Math.max(5, 30 - nextStep * 6) });
      }
    };

    socket.on('delivery:location', onLocation);
    socket.on('order:status', onOrderStatus);

    return () => {
      socket.off('delivery:location', onLocation);
      socket.off('order:status', onOrderStatus);
    };
  }, [orderId, setTracking]);

  return (
    <section className="grid-2 fade-in">
      <article className="card stack">
        <h2 style={{ margin: 0 }}>Live order tracking</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>ETA: {etaMinutes} minutes</p>
        <MapPreview marker={marker} />
      </article>

      <article className="card">
        <h3 style={{ marginTop: 0 }}>Timeline</h3>
        <Timeline currentStep={3} />
      </article>
    </section>
  );
}
