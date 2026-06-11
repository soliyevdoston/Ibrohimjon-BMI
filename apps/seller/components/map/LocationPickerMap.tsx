'use client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, useMapEvents, Circle } from 'react-leaflet';
import { useState, useEffect } from 'react';
import { MapTilerLayer, LayerSwitcher, useMapStyle } from './MapTilerLayer';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// React 18/19 StrictMode double-mount guard — same patch the customer app uses
// so MapContainer doesn't throw "Map container is already initialized".
type LeafletProtoPatch = {
  __initContainerPatched?: boolean;
  _initContainer: (id: string | HTMLElement) => void;
  remove: () => unknown;
  _container?: HTMLElement & { _leaflet_id?: number };
  _containerId?: number;
};
const _mapProto = L.Map.prototype as unknown as LeafletProtoPatch;
if (typeof window !== 'undefined' && !_mapProto.__initContainerPatched) {
  const originalInit = _mapProto._initContainer;
  _mapProto._initContainer = function (id) {
    const el = typeof id === 'string' ? document.getElementById(id) : (id as HTMLElement);
    if (el && (el as unknown as { _leaflet_id?: number })._leaflet_id) {
      delete (el as unknown as { _leaflet_id?: number })._leaflet_id;
    }
    return originalInit.call(this, id);
  };
  const originalRemove = _mapProto.remove;
  _mapProto.remove = function () {
    const self = this as unknown as LeafletProtoPatch;
    if (
      !self._container ||
      self._containerId === undefined ||
      self._container._leaflet_id !== self._containerId
    ) {
      return self;
    }
    return originalRemove.call(this);
  };
  _mapProto.__initContainerPatched = true;
}

const TASHKENT: [number, number] = [41.2995, 69.2401];

const pinIcon = L.divIcon({
  html: `<div style="
    width:38px;height:38px;background:#4f46e5;
    border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    border:3px solid #fff;box-shadow:0 4px 16px rgba(79,70,229,.45);
    display:flex;align-items:center;justify-content:center;
  "><span style="transform:rotate(45deg);font-size:16px;display:block;line-height:1;margin-top:2px;">📍</span></div>`,
  className: '',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
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
  const [mapStyle, setMapStyle] = useMapStyle('streets');
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  // Center on the seller's real device location on first open (if no point set yet)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { timeout: 5000 },
      );
    }
  }, []);

  useEffect(() => {
    return () => { mapInstance?.remove(); };
  }, [mapInstance]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        ref={setMapInstance}
        center={selected ?? userPos ?? TASHKENT}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl
      >
        <MapTilerLayer style={mapStyle} />
        <ClickHandler onPick={onSelect} />

        {userPos && !selected && (
          <Circle center={userPos} radius={30} color="#4f46e5" fillColor="#4f46e5" fillOpacity={0.2} weight={2} />
        )}

        {selected && <Marker position={selected} icon={pinIcon} />}
      </MapContainer>
      <LayerSwitcher current={mapStyle} onChange={setMapStyle} position="top-right" />
    </div>
  );
}
