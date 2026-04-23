type Segment = { label: string; value: number; color: string };

export function DonutChart({ segments, centerLabel }: { segments: Segment[]; centerLabel?: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const size = 160;
  const r = 64;
  const stroke = 20;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;

  let offset = 0;

  return (
    <div className="donut-wrap">
      <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef0f5" strokeWidth={stroke} />
          {segments.map((s, i) => {
            const frac = s.value / total;
            const dash = frac * c;
            const el = (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${cx} ${cy})`}
                strokeLinecap="butt"
                style={{ transition: 'stroke-dasharray 400ms ease' }}
              />
            );
            offset += dash;
            return el;
          })}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            lineHeight: 1.15,
          }}
        >
          <div>
            <div className="donut-center">{total.toLocaleString('uz-UZ')}</div>
            <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{centerLabel ?? 'Total'}</div>
          </div>
        </div>
      </div>

      <div className="donut-legend">
        {segments.map((s) => {
          const pct = Math.round((s.value / total) * 100);
          return (
            <div className="donut-legend-row" key={s.label}>
              <span className="hstack" style={{ minWidth: 0, gap: 8 }}>
                <span className="donut-swatch" style={{ background: s.color }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</span>
              </span>
              <strong>{s.value} · {pct}%</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}
