'use client';

import { useState } from 'react';

export default function AdminSettingsPage() {
  const [baseFee, setBaseFee] = useState(6000);
  const [perKm, setPerKm] = useState(1400);
  const [minOrder, setMinOrder] = useState(20000);
  const [otpTtl, setOtpTtl] = useState(120);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="stack">
      <div className="grid-2">
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Delivery pricing</h3>
              <div className="card-sub">Applied to all new orders</div>
            </div>
          </div>
          <div className="stack">
            <div>
              <div className="label">Base fee (soʼm)</div>
              <input className="input" type="number" value={baseFee} onChange={(e) => setBaseFee(+e.target.value)} />
            </div>
            <div>
              <div className="label">Per-km fee (soʼm)</div>
              <input className="input" type="number" value={perKm} onChange={(e) => setPerKm(+e.target.value)} />
            </div>
            <div>
              <div className="label">Minimum order amount (soʼm)</div>
              <input className="input" type="number" value={minOrder} onChange={(e) => setMinOrder(+e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>Security</h3>
              <div className="card-sub">OTP and sessions</div>
            </div>
          </div>
          <div className="stack">
            <div>
              <div className="label">OTP expiration (seconds)</div>
              <input className="input" type="number" value={otpTtl} onChange={(e) => setOtpTtl(+e.target.value)} />
            </div>
            <div>
              <div className="label">OTP retry limit per hour</div>
              <input className="input" type="number" defaultValue={5} />
            </div>
            <div>
              <div className="label">Access token TTL</div>
              <select className="select" defaultValue="15m">
                <option value="15m">15 minutes</option>
                <option value="30m">30 minutes</option>
                <option value="60m">60 minutes</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Feature flags</h3>
            <div className="card-sub">Toggle platform capabilities</div>
          </div>
        </div>
        <div className="grid-3">
          {[
            { label: 'Live courier tracking', hint: 'WebSocket GPS ingestion', on: true },
            { label: 'Card payments',         hint: 'Via Payme / Click',       on: true },
            { label: 'Auto-dispatch',         hint: 'Nearest-courier algo',    on: false },
            { label: 'Scheduled delivery',    hint: 'Pick a time slot',        on: false },
            { label: 'Promo codes',           hint: 'Discounts at checkout',   on: true },
            { label: 'Reviews',               hint: 'Post-delivery rating',    on: true },
          ].map((f) => (
            <label
              key={f.label}
              className="card"
              style={{ padding: 14, cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}
            >
              <input type="checkbox" defaultChecked={f.on} />
              <div>
                <strong style={{ fontSize: 13 }}>{f.label}</strong>
                <div className="muted" style={{ fontSize: 12 }}>{f.hint}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="hstack" style={{ justifyContent: 'flex-end', gap: 10 }}>
        {saved && <span className="chip green">✓ Saved</span>}
        <button className="btn ghost">Discard</button>
        <button className="btn" onClick={save}>Save changes</button>
      </div>
    </div>
  );
}
