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

const COURIER_PULSE_STYLE = `
  @keyframes courierPulse {
    0%,100% { box-shadow: 0 4px 20px rgba(79,70,229,.35); }
    50%      { box-shadow: 0 4px 30px rgba(79,70,229,.6), 0 0 0 10px rgba(79,70,229,.1); }
  }
`;

const courierIcon = L.divIcon({
  html: `<style>${COURIER_PULSE_STYLE}</style>
    <div style="
      width:44px;height:44px;background:#fff;
      border-radius:50%;border:3px solid #4f46e5;
      box-shadow:0 4px 20px rgba(79,70,229,.35);
      display:flex;align-items:center;justify-content:center;
      font-size:22px;
      animation:courierPulse 2s ease-in-out infinite;
    ">🛵</div>`,
  className: '',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const destinationIcon = L.divIcon({
  html: `<div style="
    width:38px;height:38px;background:#10b981;
    border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    border:3px solid #fff;box-shadow:0 4px 16px rgba(16,185,129,.45);
    display:flex;align-items:center;justify-content:center;
  "><span style="transform:rotate(45deg);font-size:18px;display:block;line-height:1;">🏠</span></div>`,
  className: '',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});

const sellerIcon = L.divIcon({
  html: `<div style="
    width:38px;height:38px;background:#f59e0b;
    border-radius:10px;border:3px solid #fff;
    box-shadow:0 4px 16px rgba(245,158,11,.45);
    display:flex;align-items:center;justify-content:center;font-size:18px;
  ">🏪</div>`,
  className: '',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

function MapAutofit({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points as L.LatLngTuple[]);
      map.fitBounds(bounds.pad(0.2), { animate: true });
    }
  }, [map, points]);
  return null;
}

export default function DeliveryTrackerMap({
  courierPos,
  destination,
  sellerPos,
}: {
  courierPos: [number, number];
  destination: [number, number];
  sellerPos: [number, number];
}) {
  const [mapStyle, setMapStyle] = useMapStyle('streets');
  const [route, setRoute] = useState<RouteResult | null>(null);

  // Fetch real road route: seller → courier → destination
  useEffect(() => {
    let cancelled = false;
    fetchRoute([sellerPos, courierPos, destination]).then((r) => {
      if (!cancelled) setRoute(r);
    });
    return () => { cancelled = true; };
  }, [sellerPos[0], sellerPos[1], courierPos[0], courierPos[1], destination[0], destination[1]]);

  const fallbackPoints: [number, number][] = [sellerPos, courierPos, destination];
  const routePoints = route?.coordinates ?? fallbackPoints;

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        center={courierPos}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <MapTilerLayer style={mapStyle} />
        <MapAutofit points={fallbackPoints} />
        <Polyline
          positions={routePoints}
          color="#4f46e5"
          weight={route ? 5 : 3}
          opacity={route ? 0.85 : 0.6}
          dashArray={route ? undefined : '8 4'}
        />
        <Marker position={sellerPos} icon={sellerIcon} />
        <Marker position={courierPos} icon={courierIcon} />
        <Marker position={destination} icon={destinationIcon} />
      </MapContainer>
      <LayerSwitcher current={mapStyle} onChange={setMapStyle} position="top-right" />
      {route && (
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          zIndex: 1000,
          background: 'rgba(255,255,255,0.96)',
          padding: '6px 12px',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 600,
          color: '#374151',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(8px)',
        }}>
          {(route.distanceMeters / 1000).toFixed(1)} km · {Math.round(route.durationSeconds / 60)} min
        </div>
      )}
    </div>
  );
}
