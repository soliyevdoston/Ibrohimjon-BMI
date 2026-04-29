'use client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { MapTilerLayer, useMapStyle, LayerSwitcher } from './MapTilerLayer';

const TASHKENT: [number, number] = [41.2995, 69.2401];

const pinIcon = L.divIcon({
  html: `<div style="
    width:34px;height:34px;background:#4f46e5;
    border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    border:3px solid #fff;box-shadow:0 4px 14px rgba(79,70,229,.5);
    display:flex;align-items:center;justify-content:center;
  "><span style="transform:rotate(45deg);font-size:14px;">📍</span></div>`,
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

function PanTo({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.panTo(position, { animate: true, duration: 0.4 });
  }, [map, position?.[0], position?.[1]]);
  return null;
}

export default function MiniMapPickerImpl({
  value,
  onChange,
}: {
  value: [number, number] | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const [mapStyle, setMapStyle] = useMapStyle('streets');
  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        center={value ?? TASHKENT}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl
      >
        <MapTilerLayer style={mapStyle} />
        <ClickHandler onPick={onChange} />
        <PanTo position={value} />
        {value && <Marker position={value} icon={pinIcon} />}
      </MapContainer>
      <LayerSwitcher current={mapStyle} onChange={setMapStyle} position="top-right" />
    </div>
  );
}
