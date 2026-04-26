'use client';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./DeliveryTrackerMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        background: '#f0f4f8',
      }}
    >
      <span style={{ color: '#8a94a6', fontSize: 14 }}>Xarita yuklanmoqda…</span>
    </div>
  ),
});

export function DeliveryTracker({
  courierPos,
  destination,
  sellerPos,
}: {
  courierPos: [number, number];
  destination: [number, number];
  sellerPos: [number, number];
}) {
  return (
    <div
      style={{
        height: 340,
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #eaecf2',
      }}
    >
      <Map courierPos={courierPos} destination={destination} sellerPos={sellerPos} />
    </div>
  );
}
