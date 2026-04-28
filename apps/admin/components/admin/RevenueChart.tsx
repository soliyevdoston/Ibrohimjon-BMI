'use client';

import { useState } from 'react';

type Point = { h: string; v: number };

export function RevenueChart({ points }: { points: Point[] }) {
  const w = 640;
  const h = 200;
  const padX = 32;
  const padY = 28;
  const maxV = Math.max(...points.map((p) => p.v));
  const step = (w - padX * 2) / (points.length - 1);

  const coords = points.map((p, i) => ({
    x: padX + i * step,
    y: padY + (1 - p.v / maxV) * (h - padY * 2),
    p,
  }));

  const line = coords.map((c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`)).join(' ');
  const area =
    `M ${coords[0].x} ${h - padY} ` +
    coords.map((c) => `L ${c.x} ${c.y}`).join(' ') +
    ` L ${coords[coords.length - 1].x} ${h - padY} Z`;

  const [hover, setHover] = useState<number | null>(null);

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: 200, display: 'block' }}
      >
        <defs>
          <linearGradient id="rev-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1={padX}
            x2={w - padX}
            y1={padY + ((h - padY * 2) / 3) * i}
            y2={padY + ((h - padY * 2) / 3) * i}
            stroke="#eef0f5"
            strokeDasharray="4 4"
          />
        ))}

        <path d={area} fill="url(#rev-grad)" />
        <path
          d={line}
          fill="none"
          stroke="#0f172a"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coords.map((c, i) => (
          <g key={i}>
            <rect
              x={c.x - step / 2}
              y={0}
              width={step}
              height={h}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((cur) => (cur === i ? null : cur))}
              style={{ cursor: 'crosshair' }}
            />
            <circle
              cx={c.x}
              cy={c.y}
              r={hover === i ? 5 : 3}
              fill="#fff"
              stroke="#0f172a"
              strokeWidth={2}
              style={{ transition: 'r 120ms ease' }}
            />
          </g>
        ))}

        {hover !== null && (
          <line
            x1={coords[hover].x}
            x2={coords[hover].x}
            y1={padY}
            y2={h - padY}
            stroke="#0f172a"
            strokeDasharray="3 3"
            strokeOpacity="0.4"
          />
        )}

        {points.map((p, i) => (
          <text
            key={p.h}
            x={coords[i].x}
            y={h - 8}
            textAnchor="middle"
            fontSize="10.5"
            fill="#8a94a6"
          >
            {p.h}
          </text>
        ))}
      </svg>

      {hover !== null && (
        <div
          className="map-tooltip"
          style={{
            left: `${(coords[hover].x / w) * 100}%`,
            top: `${(coords[hover].y / h) * 100}%`,
          }}
        >
          <strong>{coords[hover].p.v.toFixed(1)}M soʼm</strong>
          <span style={{ marginLeft: 6, opacity: 0.7 }}>· {coords[hover].p.h}:00</span>
        </div>
      )}
    </div>
  );
}
