type Props = { points: number[]; tone?: 'indigo' | 'green' | 'amber' | 'rose' | 'sky' };

const toneToStroke: Record<NonNullable<Props['tone']>, string> = {
  indigo: '#4f46e5',
  green:  '#10b981',
  amber:  '#f59e0b',
  rose:   '#ef4444',
  sky:    '#0ea5e9',
};

export function Sparkline({ points, tone = 'indigo' }: Props) {
  if (points.length < 2) return null;

  const w = 72;
  const h = 26;
  const pad = 2;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = (w - pad * 2) / (points.length - 1);

  const coords = points.map((v, i) => ({
    x: pad + i * step,
    y: pad + (1 - (v - min) / range) * (h - pad * 2),
  }));

  const line = coords.map((c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`)).join(' ');
  const area =
    `M ${coords[0].x} ${h - pad} ` +
    coords.map((c) => `L ${c.x} ${c.y}`).join(' ') +
    ` L ${coords[coords.length - 1].x} ${h - pad} Z`;

  const stroke = toneToStroke[tone];
  const gradId = `spark-${tone}`;

  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.32" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r={2} fill={stroke} />
    </svg>
  );
}
