'use client';

import { useEffect, useState } from 'react';

type Courier = { id: string; name: string; x: number; y: number };

const seed: Courier[] = [
  { id: 'c1', name: 'Jasur T.',   x: 22, y: 34 },
  { id: 'c2', name: 'Sherzod M.', x: 58, y: 22 },
  { id: 'c3', name: 'Nodir K.',   x: 74, y: 58 },
  { id: 'c4', name: 'Aziz R.',    x: 38, y: 68 },
  { id: 'c5', name: 'Laziz P.',   x: 66, y: 78 },
];

const dest = { x: 50, y: 48 };

export function LiveMap() {
  const [couriers, setCouriers] = useState<Courier[]>(seed);

  useEffect(() => {
    const id = setInterval(() => {
      setCouriers((prev) =>
        prev.map((c) => ({
          ...c,
          x: Math.max(6, Math.min(94, c.x + (Math.random() - 0.5) * 6)),
          y: Math.max(6, Math.min(94, c.y + (Math.random() - 0.5) * 6)),
        })),
      );
    }, 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="map-box" style={{ height: 320 }}>
      <div className="map-grid" />

      <svg className="map-route">
        {couriers.map((c) => (
          <line
            key={c.id}
            x1={`${c.x}%`}
            y1={`${c.y}%`}
            x2={`${dest.x}%`}
            y2={`${dest.y}%`}
            stroke="#4f46e5"
            strokeOpacity="0.25"
            strokeDasharray="4 4"
          />
        ))}
      </svg>

      <div
        className="map-marker dest"
        style={{ left: `${dest.x}%`, top: `${dest.y}%`, transform: 'translate(-50%, -50%)' }}
        title="Hub"
      />

      {couriers.map((c) => (
        <div
          key={c.id}
          className="map-marker"
          style={{ left: `${c.x}%`, top: `${c.y}%`, transform: 'translate(-50%, -50%)' }}
          title={c.name}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          left: 14,
          top: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.9)',
          border: '1px solid var(--border)',
          padding: '6px 10px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: 'var(--success)',
            boxShadow: '0 0 0 3px rgba(16,185,129,0.18)',
          }}
        />
        Live · {couriers.length} couriers moving
      </div>
    </div>
  );
}
