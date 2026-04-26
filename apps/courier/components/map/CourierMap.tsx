'use client';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./CourierMapImpl'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '100%', display: 'grid', placeItems: 'center',
      background: 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 55%, #ecfeff 100%)',
    }}>
      <div style={{ textAlign: 'center', color: '#8a94a6' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
        <div style={{ fontSize: 14 }}>Loading map…</div>
      </div>
    </div>
  ),
});

export function CourierMap(props: {
  courierPos: [number, number];
  sellerPos: [number, number];
  customerPos: [number, number];
  autofit?: boolean;
}) {
  return <Map {...props} />;
}
