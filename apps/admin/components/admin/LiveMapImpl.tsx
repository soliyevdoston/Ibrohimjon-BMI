'use client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

type CourierData = {
  id: string; name: string; lat: number; lng: number;
  eta: number; vehicle: string; isBusy: boolean;
};

const HUB: [number, number] = [41.2995, 69.2401];

const SEED: CourierData[] = [
  { id: 'c1', name: 'Jasur T.',    lat: 41.310, lng: 69.270, eta: 6,  vehicle: 'Scooter',   isBusy: true  },
  { id: 'c2', name: 'Sherzod M.', lat: 41.285, lng: 69.310, eta: 11, vehicle: 'Motorbike', isBusy: true  },
  { id: 'c3', name: 'Nodir K.',   lat: 41.325, lng: 69.295, eta: 14, vehicle: 'Car',        isBusy: false },
  { id: 'c4', name: 'Aziz R.',    lat: 41.272, lng: 69.248, eta: 4,  vehicle: 'Bicycle',    isBusy: true  },
  { id: 'c5', name: 'Laziz P.',   lat: 41.308, lng: 69.335, eta: 17, vehicle: 'Scooter',   isBusy: false },
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
      width:40px;height:40px;background:${bg};
      border-radius:50%;border:3px solid #fff;
      box-shadow:0 4px 16px ${glow};
      display:flex;align-items:center;justify-content:center;
      font-size:20px;
    ">${emoji}</div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

const hubIcon = L.divIcon({
  html: `<div style="
    width:44px;height:44px;background:#4f46e5;
    border-radius:14px;border:3px solid #fff;
    box-shadow:0 4px 20px rgba(79,70,229,.5);
    display:flex;align-items:center;justify-content:center;
    font-size:22px;
  ">⭐</div>`,
  className: '',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    try {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
    } catch {/* ignore */}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export default function LiveMapImpl({ height = 320 }: { height?: number }) {
  const [couriers, setCouriers] = useState<CourierData[]>(SEED);
  const [wsConnected, setWsConnected] = useState(false);
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Simulation fallback — always running unless WS overrides
  useEffect(() => {
    simRef.current = setInterval(() => {
      setCouriers((prev) =>
        prev.map((c) => ({
          ...c,
          lat: Math.max(41.24, Math.min(41.36, c.lat + (Math.random() - 0.5) * 0.003)),
          lng: Math.max(69.18, Math.min(69.38, c.lng + (Math.random() - 0.5) * 0.003)),
          eta: Math.max(1, Math.round(c.eta + (Math.random() - 0.55))),
        }))
      );
    }, 1800);
    return () => { if (simRef.current) clearInterval(simRef.current); };
  }, []);

  // Try real-time WebSocket for live courier locations
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
        // Fetch active deliveries and join their rooms
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

      // Real courier location update from backend
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
          // New courier not in seed list — add them
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

  const allPoints: [number, number][] = [...couriers.map((c): [number, number] => [c.lat, c.lng]), HUB];

  return (
    <div style={{ position: 'relative', height, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer
        center={HUB}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={19}
        />
        <FitBounds points={allPoints} />

        {/* Dashed lines to hub */}
        {couriers.map((c) => (
          <Polyline
            key={c.id}
            positions={[[c.lat, c.lng], HUB]}
            color={c.isBusy ? '#f59e0b' : '#10b981'}
            weight={1.5}
            opacity={0.4}
            dashArray="6 4"
          />
        ))}

        {/* Hub */}
        <Marker position={HUB} icon={hubIcon}>
          <Tooltip permanent={false} direction="top">
            <strong>Dispatch Hub</strong>
          </Tooltip>
        </Marker>

        {/* Courier markers */}
        {couriers.map((c) => (
          <Marker
            key={c.id}
            position={[c.lat, c.lng]}
            icon={makeCourierIcon(c.vehicle, c.isBusy)}
          >
            <Tooltip direction="top" offset={[0, -24]}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: '#5b6576' }}>
                {c.vehicle} · ETA {c.eta}m · {c.isBusy ? '🟡 On delivery' : '🟢 Available'}
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {/* Live badge overlay */}
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
        {wsConnected ? 'Live' : 'Simulated'} · {couriers.length} couriers
      </div>
    </div>
  );
}
