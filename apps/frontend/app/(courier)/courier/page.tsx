'use client';

import { useState } from 'react';
import { MapPreview } from '@/components/MapPreview';

export default function CourierPanelPage() {
  const [activeDelivery, setActiveDelivery] = useState<string | null>(null);

  return (
    <section className="stack fade-in">
      <header className="card">
        <h2 style={{ margin: 0 }}>Courier workspace</h2>
        <p style={{ marginBottom: 0, color: 'var(--text-secondary)' }}>
          Accept incoming jobs and update delivery statuses in one tap.
        </p>
      </header>

      {!activeDelivery ? (
        <div className="card stack">
          <h3 style={{ margin: 0 }}>Available orders</h3>
          {['del-128', 'del-132', 'del-149'].map((deliveryId) => (
            <div key={deliveryId} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between' }}>
              <span>{deliveryId}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" onClick={() => setActiveDelivery(deliveryId)}>
                  Accept
                </button>
                <button className="btn secondary">Reject</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid-2">
          <article className="card stack">
            <h3 style={{ margin: 0 }}>Active delivery: {activeDelivery}</h3>
            <MapPreview marker={{ x: 62, y: 42 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn">Picked up</button>
              <button className="btn">On the way</button>
              <button className="btn">Delivered</button>
            </div>
          </article>
          <article className="card stack">
            <h3 style={{ margin: 0 }}>Connection health</h3>
            <div className="badge">GPS update every 3-5s</div>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              If network drops, the app caches location points and syncs once online.
            </p>
          </article>
        </div>
      )}
    </section>
  );
}
