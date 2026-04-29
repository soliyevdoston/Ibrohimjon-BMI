'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { searchPlaces, type PlaceSuggestion } from '@/lib/api';
import type { PickupPoint } from '@/lib/locations';

const Map = dynamic(() => import('./LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        background: '#f0f4f8',
      }}
    >
      <span style={{ color: '#8a94a6', fontSize: 14 }}>Xarita yuklanmoqda…</span>
    </div>
  ),
});

export function LocationPicker({
  selected,
  onSelect,
  onPickupSelect,
}: {
  selected: [number, number] | null;
  onSelect: (lat: number, lng: number) => void;
  onPickupSelect?: (point: PickupPoint) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const r = await searchPlaces(query);
      setResults(r);
      setLoading(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handlePick = (s: PlaceSuggestion) => {
    onSelect(s.lat, s.lng);
    setQuery(s.label.split(',')[0]);
    setResults([]);
    setOpen(false);
  };

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #eaecf2',
        position: 'relative',
        background: '#fff',
      }}
    >
      {/* Search bar */}
      <div style={{ position: 'relative', padding: 12, borderBottom: '1px solid #eaecf2' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 16,
            color: '#9ca3af',
            pointerEvents: 'none',
          }}>🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Manzilni qidirish — masalan, Chilonzor 5"
            style={{
              width: '100%',
              padding: '10px 36px 10px 36px',
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              fontSize: 14,
              outline: 'none',
              background: '#f9fafb',
              transition: 'border 0.15s, background 0.15s',
            }}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); }}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 14,
                color: '#9ca3af',
                width: 24,
                height: 24,
              }}
              aria-label="Tozalash"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown */}
        {open && (loading || results.length > 0) && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 12,
            right: 12,
            marginTop: 4,
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 1100,
            maxHeight: 280,
            overflowY: 'auto',
          }}>
            {loading ? (
              <div style={{ padding: 14, fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
                Qidirilmoqda…
              </div>
            ) : (
              results.map((s, i) => (
                <button
                  key={`${s.lat}-${s.lng}-${i}`}
                  onMouseDown={(e) => { e.preventDefault(); handlePick(s); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    borderBottom: i < results.length - 1 ? '1px solid #f3f4f6' : 'none',
                    fontSize: 13,
                    color: '#111827',
                    lineHeight: 1.4,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 14, marginTop: 1 }}>📍</span>
                    <span>{s.label}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Hint strip */}
      <div style={{
        padding: '8px 14px',
        background: '#ecfeff',
        borderBottom: '1px solid #cffafe',
        fontSize: 12,
        color: '#0e7490',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 14 }}>📦</span>
        <span>Olib ketish punktini tanlash uchun xaritadagi 📦 belgisini bosing</span>
      </div>

      {/* Map */}
      <div style={{ height: 380, position: 'relative' }}>
        <Map selected={selected} onSelect={onSelect} onPickupSelect={onPickupSelect} />
      </div>
    </div>
  );
}
