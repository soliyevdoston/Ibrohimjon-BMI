'use client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { MapTilerLayer, LayerSwitcher, useMapStyle } from './MapTilerLayer';
import { fetchRoute, type RouteResult } from '@/lib/routing';

const courierIcon = L.divIcon({
  html: `<div style="
    width:48px;height:48px;background:#fff;
    border-radius:50%;border:3px solid #4f46e5;
    box-shadow:0 4px 20px rgba(79,70,229,.4);
    display:flex;align-items:center;justify-content:center;
    font-size:24px;
  ">🛵</div>
  <div style="
    position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);
    width:8px;height:8px;border-radius:50%;
    background:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,.2);
    animation:gpsPulse 2s ease-in-out infinite;
  "></div>
  <style>
    @keyframes gpsPulse{
      0%,100%{box-shadow:0 0 0 3px rgba(79,70,229,.2)}
      50%{box-shadow:0 0 0 8px rgba(79,70,229,.1)}
    }
  </style>`,
  className: '',
  iconSize: [48, 52],
  iconAnchor: [24, 50],
});

const sellerIcon = L.divIcon({
  html: `<div style="
    width:40px;height:40px;background:#f59e0b;
    border-radius:12px;border:3px solid #fff;
    box-shadow:0 4px 16px rgba(245,158,11,.5);
    display:flex;align-items:center;justify-content:center;font-size:20px;
  ">🏪</div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
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

function MapAutofit({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    try {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    } catch {/* ignore */}
  }, [map, points.map((p) => p.join()).join(',')]);
  return null;
}

function PanTo({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(position, { animate: true, duration: 0.5 });
  }, [map, position[0], position[1]]);
  return null;
}

export default function CourierMapImpl({
  courierPos,
  sellerPos,
  customerPos,
  autofit = false,
}: {
  courierPos: [number, number];
  sellerPos: [number, number];
  customerPos: [number, number];
  autofit?: boolean;
}) {
  const [mapStyle, setMapStyle] = useMapStyle('streets');
  const [route, setRoute] = useState<RouteResult | null>(null);

  // Fetch real road route through all 3 points (refresh on courier movement, throttled by integer round)
  useEffect(() => {
    let cancelled = false;
    fetchRoute([sellerPos, courierPos, customerPos]).then((r) => {
      if (!cancelled) setRoute(r);
    });
    return () => { cancelled = true; };
  }, [
    sellerPos[0], sellerPos[1],
    Math.round(courierPos[0] * 1000) / 1000,
    Math.round(courierPos[1] * 1000) / 1000,
    customerPos[0], customerPos[1],
  ]);

  const fallbackPoints: [number, number][] = [sellerPos, courierPos, customerPos];
  const routePoints = route?.coordinates ?? fallbackPoints;

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        center={courierPos}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl
      >
        <MapTilerLayer style={mapStyle} />

        {autofit ? (
          <MapAutofit points={fallbackPoints} />
        ) : (
          <PanTo position={courierPos} />
        )}

        <Polyline
          positions={routePoints}
          color="#4f46e5"
          weight={route ? 6 : 4}
          opacity={route ? 0.85 : 0.6}
          dashArray={route ? undefined : '10 6'}
        />

        <Marker position={sellerPos} icon={sellerIcon} />
        <Marker position={courierPos} icon={courierIcon} />
        <Marker position={customerPos} icon={customerIcon} />
      </MapContainer>
      <LayerSwitcher current={mapStyle} onChange={setMapStyle} position="top-right" />
    </div>
  );
}
