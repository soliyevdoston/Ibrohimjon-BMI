'use client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from 'react-leaflet';
import { useState, useEffect } from 'react';

// Fix default Leaflet icon URLs broken by Webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TASHKENT: [number, number] = [41.2995, 69.2401];

const pinIcon = L.divIcon({
  html: `<div style="
    width:38px;height:38px;
    background:#4f46e5;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    border:3px solid #fff;
    box-shadow:0 4px 16px rgba(79,70,229,.45);
    display:flex;align-items:center;justify-content:center;
  "><span style="transform:rotate(45deg);font-size:16px;display:block;line-height:1;margin-top:2px;">📍</span></div>`,
  className: '',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

export default function LocationPickerMap({
  selected,
  onSelect,
}: {
  selected: [number, number] | null;
  onSelect: (lat: number, lng: number) => void;
}) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPos([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          // Permission denied or unavailable — ignore
        },
        { timeout: 5000 }
      );
    }
  }, []);

  return (
    <MapContainer
      center={selected ?? userPos ?? TASHKENT}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      zoomControl
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={19}
      />
      <ClickHandler onPick={onSelect} />
      {userPos && (
        <Circle
          center={userPos}
          radius={30}
          color="#4f46e5"
          fillColor="#4f46e5"
          fillOpacity={0.2}
          weight={2}
        />
      )}
      {selected && <Marker position={selected} icon={pinIcon} />}
    </MapContainer>
  );
}
