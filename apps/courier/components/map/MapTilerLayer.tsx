'use client';
import { TileLayer } from 'react-leaflet';
import { useState } from 'react';

const DEFAULT_KEY = 'OuhRqlcIjPk0S9JgN6Dy';
const KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || DEFAULT_KEY;

export type MapStyle = 'streets' | 'satellite';

const STYLES = {
  streets: {
    label: "Ko'cha",
    url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${KEY}`,
    attribution:
      '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
  },
  satellite: {
    label: "Sun'iy yo'ldosh",
    url: `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${KEY}`,
    attribution: '&copy; MapTiler &copy; OSM',
  },
} as const;

export function MapTilerLayer({ style }: { style: MapStyle }) {
  const s = STYLES[style];
  return <TileLayer key={style} url={s.url} attribution={s.attribution} maxZoom={19} />;
}

export function useMapStyle(initial: MapStyle = 'streets') {
  return useState<MapStyle>(initial);
}

type Pos = 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';

export function LayerSwitcher({
  current,
  onChange,
  position = 'top-right',
}: {
  current: MapStyle;
  onChange: (s: MapStyle) => void;
  position?: Pos;
}) {
  const styles: React.CSSProperties = {
    position: 'absolute',
    zIndex: 1000,
    display: 'flex',
    gap: 2,
    padding: 3,
    background: 'rgba(255,255,255,0.96)',
    borderRadius: 10,
    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(0,0,0,0.06)',
    ...(position.includes('top') ? { top: 10 } : { bottom: 10 }),
    ...(position.includes('right') ? { right: 10 } : { left: 10 }),
  };

  return (
    <div style={styles}>
      {(['streets', 'satellite'] as MapStyle[]).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          style={{
            padding: '6px 12px',
            border: 'none',
            borderRadius: 7,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            background: current === s ? '#7C3AED' : 'transparent',
            color: current === s ? '#ffffff' : '#374151',
            transition: 'background 0.15s, color 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {STYLES[s].label}
        </button>
      ))}
    </div>
  );
}
