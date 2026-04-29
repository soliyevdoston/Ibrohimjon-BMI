'use client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, useMapEvents, Circle, Tooltip } from 'react-leaflet';
import { useState, useEffect } from 'react';
import { MapTilerLayer, LayerSwitcher, useMapStyle } from './MapTilerLayer';
import { PICKUP_POINTS, type PickupPoint } from '@/lib/locations';

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

const PICKUP_TYPE_EMOJI: Record<PickupPoint['type'], string> = {
  mall: '🛍', store: '🏪', kiosk: '🏷', locker: '📦',
};

function makePickupIcon(p: PickupPoint, isSelected: boolean) {
  const emoji = PICKUP_TYPE_EMOJI[p.type];
  const border = isSelected ? '#4f46e5' : '#06b6d4';
  const size = isSelected ? 36 : 30;
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;background:#fff;
      border-radius:50%;border:3px solid ${border};
      box-shadow:0 2px 10px ${isSelected ? 'rgba(79,70,229,.45)' : 'rgba(6,182,212,.35)'};
      display:flex;align-items:center;justify-content:center;
      font-size:${isSelected ? 16 : 14}px;
    ">${emoji}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

export default function LocationPickerMap({
  selected,
  onSelect,
  onPickupSelect,
  showPickupPoints = true,
}: {
  selected: [number, number] | null;
  onSelect: (lat: number, lng: number) => void;
  onPickupSelect?: (point: PickupPoint) => void;
  showPickupPoints?: boolean;
}) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [mapStyle, setMapStyle] = useMapStyle('streets');

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPos([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  const isSelectedPickup = (p: PickupPoint) =>
    selected !== null &&
    Math.abs(p.lat - selected[0]) < 1e-5 &&
    Math.abs(p.lng - selected[1]) < 1e-5;

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        center={selected ?? userPos ?? TASHKENT}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl
      >
        <MapTilerLayer style={mapStyle} />
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

        {showPickupPoints && PICKUP_POINTS.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={makePickupIcon(p, isSelectedPickup(p))}
            eventHandlers={{
              click: () => {
                onSelect(p.lat, p.lng);
                onPickupSelect?.(p);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -16]}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: '#5b6576' }}>{p.district}</div>
              <div style={{ fontSize: 11, color: '#06b6d4', marginTop: 2 }}>
                📦 Olib ketish · {p.hours}
              </div>
            </Tooltip>
          </Marker>
        ))}

        {selected && <Marker position={selected} icon={pinIcon} />}
      </MapContainer>
      <LayerSwitcher current={mapStyle} onChange={setMapStyle} position="top-right" />
    </div>
  );
}
