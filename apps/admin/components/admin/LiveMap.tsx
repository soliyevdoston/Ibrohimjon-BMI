'use client';
import dynamic from 'next/dynamic';

const LiveMapImpl = dynamic(() => import('./LiveMapImpl'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: 320,
      background: 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 55%, #ecfeff 100%)',
      borderRadius: 16,
      display: 'grid',
      placeItems: 'center',
      border: '1px solid var(--border)',
    }}>
      <div style={{ textAlign: 'center', color: '#8a94a6' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Loading live map…</div>
        <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>Connecting to Tashkent fleet</div>
      </div>
    </div>
  ),
});

export function LiveMap({ height = 320 }: { height?: number }) {
  return <LiveMapImpl height={height} />;
}
