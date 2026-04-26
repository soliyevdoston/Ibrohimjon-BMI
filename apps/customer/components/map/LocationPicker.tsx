'use client';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        background: '#f0f4f8',
        borderRadius: 16,
      }}
    >
      <span style={{ color: '#8a94a6', fontSize: 14 }}>Xarita yuklanmoqda…</span>
    </div>
  ),
});

export function LocationPicker({
  selected,
  onSelect,
}: {
  selected: [number, number] | null;
  onSelect: (lat: number, lng: number) => void;
}) {
  return (
    <div
      style={{
        height: 380,
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #eaecf2',
        position: 'relative',
      }}
    >
      <Map selected={selected} onSelect={onSelect} />
    </div>
  );
}
