'use client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MapTilerLayer, LayerSwitcher, useMapStyle } from './MapTilerLayer';
import { type Branch, type PickupPoint } from '@/lib/locations';
import { useBranches, usePickups } from '@/lib/admin-store';

type CourierData = {
  id: string; name: string; lat: number; lng: number;
  eta: number; vehicle: string; isBusy: boolean;
  branchId?: string;
};

const TASHKENT_CENTER: [number, number] = [41.3000, 69.2700];

const SEED: CourierData[] = [
  { id: 'c1', name: 'Jasur T.',    lat: 41.310, lng: 69.270, eta: 6,  vehicle: 'Scooter',   isBusy: true,  branchId: 'br-shayxontohur' },
  { id: 'c2', name: 'Sherzod M.', lat: 41.285, lng: 69.310, eta: 11, vehicle: 'Motorbike', isBusy: true,  branchId: 'br-yashnobod'   },
  { id: 'c3', name: 'Nodir K.',   lat: 41.325, lng: 69.295, eta: 14, vehicle: 'Car',        isBusy: false, branchId: 'br-mirzo-ulugbek' },
  { id: 'c4', name: 'Aziz R.',    lat: 41.272, lng: 69.248, eta: 4,  vehicle: 'Bicycle',    isBusy: true,  branchId: 'br-chilonzor'   },
  { id: 'c5', name: 'Laziz P.',   lat: 41.308, lng: 69.335, eta: 17, vehicle: 'Scooter',   isBusy: false, branchId: 'br-yashnobod'   },
  { id: 'c6', name: 'Bekzod O.',  lat: 41.358, lng: 69.288, eta: 9,  vehicle: 'Motorbike', isBusy: true,  branchId: 'br-yunusobod'   },
  { id: 'c7', name: 'Sanjar U.',  lat: 41.348, lng: 69.225, eta: 12, vehicle: 'Scooter',   isBusy: false, branchId: 'br-olmazor'     },
  { id: 'c8', name: 'Diyor F.',   lat: 41.235, lng: 69.220, eta: 7,  vehicle: 'Car',        isBusy: true,  branchId: 'br-sergeli'     },
];

const VEHICLE_EMOJI: Record<string, string> = {
  Car: '🚗', Bicycle: '🚲', Motorbike: '🏍', Scooter: '🛵',
};

function makeCourierIcon(vehicle: string, isBusy: boolean) {
  const emoji = VEHICLE_EMOJI[vehicle] ?? '🛵';
  const bg = isBusy ? '#f59e0b' : '#10b981';
  const glow = isBusy ? 'rgba(245,158,11,.35)' : 'rgba(16,185,129,.35)';
  return L.divIcon({
    html: `<div style="
      width:38px;height:38px;background:${bg};
      border-radius:50%;border:3px solid #fff;
      box-shadow:0 4px 14px ${glow};
      display:flex;align-items:center;justify-content:center;
      font-size:18px;
    ">${emoji}</div>`,
    className: '',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

const BRANCH_STATUS_COLOR: Record<Branch['status'], { bg: string; glow: string; label: string }> = {
  active: { bg: '#4f46e5', glow: 'rgba(79,70,229,.45)', label: '🟢 Faol' },
  busy:   { bg: '#f59e0b', glow: 'rgba(245,158,11,.45)', label: '🟡 Band' },
  closed: { bg: '#6b7280', glow: 'rgba(107,114,128,.45)', label: '⚫ Yopiq' },
};

function makeBranchIcon(b: Branch) {
  const { bg, glow } = BRANCH_STATUS_COLOR[b.status];
  const size = b.type === 'main' ? 50 : 42;
  const emoji = b.type === 'main' ? '🏢' : '🏬';
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;background:${bg};
      border-radius:14px;border:3px solid #fff;
      box-shadow:0 4px 18px ${glow};
      display:flex;align-items:center;justify-content:center;
      font-size:${size === 50 ? 24 : 20}px;
    ">${emoji}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const PICKUP_TYPE_EMOJI: Record<PickupPoint['type'], string> = {
  mall: '🛍', store: '🏪', kiosk: '🏷', locker: '📦',
};

function makePickupIcon(p: PickupPoint) {
  const emoji = PICKUP_TYPE_EMOJI[p.type];
  return L.divIcon({
    html: `<div style="
      width:30px;height:30px;background:#fff;
      border-radius:50%;border:2px solid #06b6d4;
      box-shadow:0 2px 8px rgba(6,182,212,.35);
      display:flex;align-items:center;justify-content:center;
      font-size:14px;
    ">${emoji}</div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    try {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 13 });
    } catch {/* ignore */}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

type LayerKey = 'branches' | 'pickups' | 'couriers' | 'links';

export default function LiveMapImpl({ height = 320 }: { height?: number }) {
  const { items: BRANCHES } = useBranches();
  const { items: PICKUP_POINTS } = usePickups();
  const [couriers, setCouriers] = useState<CourierData[]>(SEED);
  const [wsConnected, setWsConnected] = useState(false);
  const [mapStyle, setMapStyle] = useMapStyle('streets');
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    branches: true,
    pickups: true,
    couriers: true,
    links: true,
  });
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    simRef.current = setInterval(() => {
      setCouriers((prev) =>
        prev.map((c) => ({
          ...c,
          lat: Math.max(41.22, Math.min(41.38, c.lat + (Math.random() - 0.5) * 0.003)),
          lng: Math.max(69.18, Math.min(69.36, c.lng + (Math.random() - 0.5) * 0.003)),
          eta: Math.max(1, Math.round(c.eta + (Math.random() - 0.55))),
        }))
      );
    }, 1800);
    return () => { if (simRef.current) clearInterval(simRef.current); };
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';
    if (!token) return;

    try {
      const socket = io(`${process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000'}/realtime`, {
        auth: { token },
        transports: ['websocket'],
        reconnectionDelay: 3000,
        timeout: 5000,
      });
      socketRef.current = socket;

      socket.on('connect', async () => {
        setWsConnected(true);
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/deliveries?status=active&limit=50`,
            { headers: { authorization: `Bearer ${token}` } }
          );
          if (res.ok) {
            const data = await res.json();
            const deliveries: Array<{ id: string }> = Array.isArray(data) ? data : data.items ?? data.data ?? [];
            deliveries.forEach((d) => socket.emit('delivery:join', { deliveryId: d.id }));
          }
        } catch {/* ignore */}
      });

      socket.on('delivery:location', (payload: {
        deliveryId: string; courierId?: string; courierName?: string;
        lat: number; lng: number; vehicle?: string;
      }) => {
        setCouriers((prev) => {
          const existing = prev.find((c) => c.id === (payload.courierId ?? payload.deliveryId));
          if (existing) {
            return prev.map((c) =>
              c.id === existing.id ? { ...c, lat: payload.lat, lng: payload.lng } : c
            );
          }
          return [...prev, {
            id: payload.courierId ?? payload.deliveryId,
            name: payload.courierName ?? 'Courier',
            lat: payload.lat,
            lng: payload.lng,
            eta: 10,
            vehicle: payload.vehicle ?? 'Scooter',
            isBusy: true,
          }];
        });
      });

      socket.on('connect_error', () => setWsConnected(false));
      socket.on('disconnect', () => setWsConnected(false));

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    } catch {/* skip WS if unavailable */}
  }, []);

  const branchById = new Map(BRANCHES.map((b) => [b.id, b]));
  const allPoints: [number, number][] = [
    ...BRANCHES.map((b): [number, number] => [b.lat, b.lng]),
    ...couriers.map((c): [number, number] => [c.lat, c.lng]),
  ];

  const toggle = (k: LayerKey) => setLayers((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div style={{ position: 'relative', height, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer
        center={TASHKENT_CENTER}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl
      >
        <MapTilerLayer style={mapStyle} />
        <FitBounds points={allPoints} />

        {/* Courier → branch dashed link lines */}
        {layers.links && layers.couriers && couriers.map((c) => {
          const home = c.branchId ? branchById.get(c.branchId) : undefined;
          if (!home) return null;
          return (
            <Polyline
              key={`link-${c.id}`}
              positions={[[c.lat, c.lng], [home.lat, home.lng]]}
              color={c.isBusy ? '#f59e0b' : '#10b981'}
              weight={1.2}
              opacity={0.35}
              dashArray="5 5"
            />
          );
        })}

        {/* Branches */}
        {layers.branches && BRANCHES.map((b) => (
          <Marker key={b.id} position={[b.lat, b.lng]} icon={makeBranchIcon(b)}>
            <Tooltip direction="top" offset={[0, -22]}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{b.name}</div>
              <div style={{ fontSize: 11, color: '#5b6576', marginBottom: 4 }}>
                {b.address} · {b.district}
              </div>
              <div style={{ fontSize: 11, color: '#374151', display: 'flex', gap: 10 }}>
                <span>🕒 {b.hours}</span>
                <span>🛵 {b.couriers}/{b.capacity}</span>
              </div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                {BRANCH_STATUS_COLOR[b.status].label}
              </div>
            </Tooltip>
          </Marker>
        ))}

        {/* Pickup points */}
        {layers.pickups && PICKUP_POINTS.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={makePickupIcon(p)}>
            <Tooltip direction="top" offset={[0, -16]}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: '#5b6576' }}>
                {p.address} · {p.district}
              </div>
              <div style={{ fontSize: 11, color: '#06b6d4', marginTop: 2 }}>
                📦 Olib ketish punkti · 🕒 {p.hours}
              </div>
            </Tooltip>
          </Marker>
        ))}

        {/* Couriers */}
        {layers.couriers && couriers.map((c) => (
          <Marker
            key={c.id}
            position={[c.lat, c.lng]}
            icon={makeCourierIcon(c.vehicle, c.isBusy)}
          >
            <Tooltip direction="top" offset={[0, -22]}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: '#5b6576' }}>
                {c.vehicle} · ETA {c.eta}m · {c.isBusy ? '🟡 Yetkazmoqda' : '🟢 Bo\'sh'}
              </div>
              {c.branchId && branchById.get(c.branchId) && (
                <div style={{ fontSize: 11, color: '#4f46e5', marginTop: 2 }}>
                  🏢 {branchById.get(c.branchId)!.name}
                </div>
              )}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      <LayerSwitcher current={mapStyle} onChange={setMapStyle} position="top-right" />

      {/* Layer toggles */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1000,
        background: 'rgba(255,255,255,0.96)',
        borderRadius: 12,
        padding: 8,
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 160,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', padding: '2px 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Qatlamlar
        </div>
        {[
          { k: 'branches' as LayerKey, label: '🏢 Filiallar', count: BRANCHES.length },
          { k: 'pickups' as LayerKey,  label: '📦 Punktlar',   count: PICKUP_POINTS.length },
          { k: 'couriers' as LayerKey, label: '🛵 Kuryerlar', count: couriers.length },
          { k: 'links' as LayerKey,    label: '┄ Yo\'nalish',  count: null },
        ].map(({ k, label, count }) => (
          <button
            key={k}
            onClick={() => toggle(k)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              padding: '6px 8px',
              border: 'none',
              borderRadius: 7,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              background: layers[k] ? '#eef2ff' : 'transparent',
              color: layers[k] ? '#4338ca' : '#9ca3af',
              transition: 'background 0.15s',
              textAlign: 'left',
            }}
          >
            <span>{label}</span>
            {count !== null && (
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 999,
                background: layers[k] ? '#4338ca' : '#e5e7eb',
                color: layers[k] ? '#fff' : '#6b7280',
              }}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Status badge */}
      <div style={{
        position: 'absolute', left: 14, bottom: 14, zIndex: 1000,
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.92)', border: '1px solid var(--border)',
        padding: '6px 12px', borderRadius: 999,
        fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
        backdropFilter: 'blur(6px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: 999,
          background: wsConnected ? 'var(--success)' : '#f59e0b',
          boxShadow: wsConnected ? '0 0 0 3px rgba(16,185,129,0.2)' : '0 0 0 3px rgba(245,158,11,0.2)',
        }} />
        {wsConnected ? 'Live' : 'Simulated'} · {couriers.length} kuryer · {BRANCHES.length} filial
      </div>
    </div>
  );
}
