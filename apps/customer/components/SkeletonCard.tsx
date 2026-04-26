'use client';

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      {/* Image area */}
      <div
        className="skeleton"
        style={{ width: '100%', aspectRatio: '1', borderRadius: '0' }}
      />
      {/* Body */}
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Title lines */}
        <div className="skeleton skeleton-text" style={{ width: '85%' }} />
        <div className="skeleton skeleton-text" style={{ width: '60%' }} />
        {/* Seller */}
        <div className="skeleton skeleton-text" style={{ width: '40%', height: 10, marginTop: 2 }} />
        {/* Price + button row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <div className="skeleton skeleton-text" style={{ width: '45%', height: 16 }} />
          <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}
