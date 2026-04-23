type Point = { h: string; v: number };

export function RevenueChart({ points }: { points: Point[] }) {
  const w = 640;
  const h = 180;
  const padX = 28;
  const padY = 24;
  const maxV = Math.max(...points.map((p) => p.v));
  const step = (w - padX * 2) / (points.length - 1);

  const coords = points.map((p, i) => ({
    x: padX + i * step,
    y: padY + (1 - p.v / maxV) * (h - padY * 2),
  }));

  const line = coords.map((c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`)).join(' ');
  const area =
    `M ${coords[0].x} ${h - padY} ` +
    coords.map((c) => `L ${c.x} ${c.y}`).join(' ') +
    ` L ${coords[coords.length - 1].x} ${h - padY} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: 180, display: 'block' }}
    >
      <defs>
        <linearGradient id="rev-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
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
      <path d={line} fill="none" stroke="#4f46e5" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />

      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={3} fill="#fff" stroke="#4f46e5" strokeWidth={2} />
        </g>
      ))}

      {points.map((p, i) => (
        <text
          key={p.h}
          x={coords[i].x}
          y={h - 6}
          textAnchor="middle"
          fontSize="10"
          fill="#8a94a6"
        >
          {p.h}
        </text>
      ))}
    </svg>
  );
}
