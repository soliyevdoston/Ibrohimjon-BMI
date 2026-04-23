import React from 'react';
import { IconArrowDown, IconArrowUp } from './Icon';
import { Sparkline } from './Sparkline';

type Props = {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  tone?: 'indigo' | 'green' | 'amber' | 'rose' | 'sky';
  icon: React.ComponentType<{ size?: number }>;
  trendData?: number[];
};

export function KpiCard({ label, value, delta, hint, tone = 'indigo', icon: Icon, trendData }: Props) {
  const up = typeof delta === 'number' ? delta > 0 : undefined;
  const trendClass = delta === undefined ? 'flat' : up ? 'up' : 'down';

  return (
    <div className="kpi">
      <div className="kpi-row">
        <span className="kpi-label">{label}</span>
        <span className={`kpi-ico ${tone}`}>
          <Icon size={18} />
        </span>
      </div>

      <div className="kpi-row" style={{ alignItems: 'flex-end' }}>
        <div className="kpi-value">{value}</div>
        {trendData && trendData.length > 1 && (
          <Sparkline points={trendData} tone={tone} />
        )}
      </div>

      <div className="kpi-row">
        {delta !== undefined && (
          <span className={`kpi-trend ${trendClass}`}>
            {up ? <IconArrowUp size={12} stroke={2.4} /> : <IconArrowDown size={12} stroke={2.4} />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint && <span className="kpi-meta">{hint}</span>}
      </div>
    </div>
  );
}
