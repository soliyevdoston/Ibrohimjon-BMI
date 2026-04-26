'use client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { useEffect } from 'react';

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
  const allPoints: [number, number][] = [sellerPos, courierPos, customerPos];

  return (
    <MapContainer
      center={courierPos}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      zoomControl
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={19}
      />

      {autofit ? (
        <MapAutofit points={allPoints} />
      ) : (
        <PanTo position={courierPos} />
      )}

      {/* Route polyline */}
      <Polyline
        positions={allPoints}
        color="#4f46e5"
        weight={4}
        opacity={0.6}
        dashArray="10 6"
      />

      {/* Seller origin */}
      <Marker position={sellerPos} icon={sellerIcon} />

      {/* Courier (animated) */}
      <Marker position={courierPos} icon={courierIcon} />

      {/* Customer destination */}
      <Marker position={customerPos} icon={customerIcon} />
    </MapContainer>
  );
}
