'use client';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./MiniMapPickerImpl'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '100%',
      display: 'grid',
      placeItems: 'center',
      background: '#f0f4f8',
      borderRadius: 12,
    }}>
      <span style={{ color: '#8a94a6', fontSize: 13 }}>Xarita yuklanmoqda…</span>
    </div>
  ),
});

export function MiniMapPicker({
  value,
  onChange,
  height = 280,
  hint = 'Xaritaga bosib joyni tanlang',
}: {
  value: [number, number] | null;
  onChange: (lat: number, lng: number) => void;
  height?: number;
  hint?: string;
}) {
  return (
    <div style={{
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid var(--border, #e5e7eb)',
      position: 'relative',
    }}>
      <div style={{ height, position: 'relative' }}>
        <Map value={value} onChange={onChange} />
      </div>
      <div style={{
        padding: '8px 12px',
        background: 'var(--surface-2, #f9fafb)',
        borderTop: '1px solid var(--border, #e5e7eb)',
        fontSize: 12,
        color: 'var(--text-secondary, #374151)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>{hint}</span>
        {value && (
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted, #6b7280)' }}>
            {value[0].toFixed(5)}, {value[1].toFixed(5)}
          </span>
        )}
      </div>
    </div>
  );
}
