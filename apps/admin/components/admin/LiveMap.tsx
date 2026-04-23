'use client';

import { useEffect, useState } from 'react';

type Courier = { id: string; name: string; x: number; y: number; eta: number; vehicle: string };

const seed: Courier[] = [
  { id: 'c1', name: 'Jasur T.',   x: 22, y: 34, eta: 6,  vehicle: 'Scooter' },
  { id: 'c2', name: 'Sherzod M.', x: 58, y: 22, eta: 11, vehicle: 'Motorbike' },
  { id: 'c3', name: 'Nodir K.',   x: 74, y: 58, eta: 14, vehicle: 'Car' },
  { id: 'c4', name: 'Aziz R.',    x: 38, y: 68, eta: 4,  vehicle: 'Bicycle' },
  { id: 'c5', name: 'Laziz P.',   x: 66, y: 78, eta: 17, vehicle: 'Scooter' },
];

const dest = { x: 50, y: 48 };

export function LiveMap({ height = 320 }: { height?: number }) {
  const [couriers, setCouriers] = useState<Courier[]>(seed);
  const [hover, setHover] = useState<Courier | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setCouriers((prev) =>
        prev.map((c) => ({
          ...c,
          x: Math.max(6, Math.min(94, c.x + (Math.random() - 0.5) * 5)),
          y: Math.max(6, Math.min(94, c.y + (Math.random() - 0.5) * 5)),
          eta: Math.max(1, Math.round(c.eta + (Math.random() - 0.55))),
        })),
      );
    }, 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="map-box" style={{ height }}>
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
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          onMouseEnter={() => setHover(c)}
          onMouseLeave={() => setHover((cur) => (cur?.id === c.id ? null : cur))}
        />
      ))}

      {hover && (
        <div className="map-tooltip" style={{ left: `${hover.x}%`, top: `${hover.y}%` }}>
          <strong>{hover.name}</strong>
          <span style={{ marginLeft: 6, opacity: 0.7 }}>
            · {hover.vehicle} · {hover.eta}m ETA
          </span>
        </div>
      )}

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

      <div
        style={{
          position: 'absolute',
          right: 14,
          top: 14,
          display: 'flex',
          gap: 6,
        }}
      >
        {['+', '−'].map((sym) => (
          <button
            key={sym}
            className="icon-btn"
            style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.95)' }}
            aria-label={sym === '+' ? 'Zoom in' : 'Zoom out'}
          >
            {sym}
          </button>
        ))}
      </div>
    </div>
  );
}
