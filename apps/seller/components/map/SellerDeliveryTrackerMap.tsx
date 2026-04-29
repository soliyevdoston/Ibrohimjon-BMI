'use client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { MapTilerLayer, LayerSwitcher, useMapStyle } from './MapTilerLayer';
import { fetchRoute, type RouteResult } from '@/lib/routing';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PULSE = `
  @keyframes courierPulseSeller {
    0%,100% { box-shadow: 0 4px 20px rgba(79,70,229,.35); }
    50%      { box-shadow: 0 4px 30px rgba(79,70,229,.6), 0 0 0 10px rgba(79,70,229,.1); }
  }
`;

const courierIcon = L.divIcon({
  html: `<style>${PULSE}</style>
    <div style="
      width:46px;height:46px;background:#fff;
      border-radius:50%;border:3px solid #4f46e5;
      box-shadow:0 4px 20px rgba(79,70,229,.35);
      display:flex;align-items:center;justify-content:center;
      font-size:22px;
      animation:courierPulseSeller 2s ease-in-out infinite;
    ">🛵</div>`,
  className: '',
  iconSize: [46, 46],
  iconAnchor: [23, 23],
});

const sellerSelfIcon = L.divIcon({
  html: `<div style="
    width:42px;height:42px;background:#f59e0b;
    border-radius:12px;border:3px solid #fff;
    box-shadow:0 4px 18px rgba(245,158,11,.55);
    display:flex;align-items:center;justify-content:center;font-size:20px;
  ">🏪</div>`,
  className: '',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

const customerIcon = L.divIcon({
  html: `<div style="
    width:40px;height:40px;background:#10b981;
    border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    border:3px solid #fff;
    box-shadow:0 4px 16px rgba(16,185,129,.5);
    display:flex;align-items:center;justify-content:center;
  "><span style="transform:rotate(45deg);font-size:18px;">🏠</span></div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 38],
});

function FitOnce({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    try {
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 15 });
    } catch {/* ignore */}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export default function SellerDeliveryTrackerMap({
  sellerPos,
  courierPos,
  customerPos,
}: {
  sellerPos: [number, number];
  courierPos: [number, number] | null;
  customerPos: [number, number];
}) {
  const [mapStyle, setMapStyle] = useMapStyle('streets');
  const [route, setRoute] = useState<RouteResult | null>(null);

  useEffect(() => {
    if (!courierPos) return;
    let cancelled = false;
    fetchRoute([sellerPos, courierPos, customerPos]).then((r: RouteResult | null) => {
      if (!cancelled) setRoute(r);
    });
    return () => { cancelled = true; };
  }, [
    sellerPos[0], sellerPos[1],
    courierPos ? Math.round(courierPos[0] * 1000) / 1000 : null,
    courierPos ? Math.round(courierPos[1] * 1000) / 1000 : null,
    customerPos[0], customerPos[1],
  ]);

  const fallbackPoints: [number, number][] = courierPos
    ? [sellerPos, courierPos, customerPos]
    : [sellerPos, customerPos];
  const routePoints = route?.coordinates ?? fallbackPoints;

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        center={courierPos ?? sellerPos}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl
      >
        <MapTilerLayer style={mapStyle} />
        <FitOnce points={fallbackPoints} />

        <Polyline
          positions={routePoints}
          color="#4f46e5"
          weight={route ? 5 : 3}
          opacity={route ? 0.85 : 0.5}
          dashArray={route ? undefined : '8 4'}
        />

        <Marker position={sellerPos} icon={sellerSelfIcon} />
        {courierPos && <Marker position={courierPos} icon={courierIcon} />}
        <Marker position={customerPos} icon={customerIcon} />
      </MapContainer>

      <LayerSwitcher current={mapStyle} onChange={setMapStyle} position="top-right" />

      {route && courierPos && (
        <div style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          zIndex: 1000,
          background: 'rgba(255,255,255,0.96)',
          padding: '8px 14px',
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 600,
          color: '#374151',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}>
          <span>📏 {(route.distanceMeters / 1000).toFixed(1)} km</span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span>⏱ {Math.round(route.durationSeconds / 60)} min</span>
        </div>
      )}

      {!courierPos && (
        <div style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          zIndex: 1000,
          background: 'rgba(255,255,255,0.96)',
          padding: '8px 14px',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          color: '#6b7280',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(8px)',
        }}>
          Kuryer hali tayinlanmagan
        </div>
      )}
    </div>
  );
}
