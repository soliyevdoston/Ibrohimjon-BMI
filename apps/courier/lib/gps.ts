const TASHKENT: [number, number] = [41.2995, 69.2401];

export function startGPSTracking(
  onUpdate: (lat: number, lng: number) => void,
  intervalMs = 4000
): () => void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return startSimulatedTracking(onUpdate, TASHKENT, TASHKENT, intervalMs);
  }

  let watchId: number | null = null;

  const success = (pos: GeolocationPosition) => {
    onUpdate(pos.coords.latitude, pos.coords.longitude);
  };

  const error = () => {
    const cleanup = startSimulatedTracking(onUpdate, TASHKENT, TASHKENT, intervalMs);
    cleanup();
  };

  try {
    watchId = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 10000,
    });
  } catch {
    return startSimulatedTracking(onUpdate, TASHKENT, TASHKENT, intervalMs);
  }

  return () => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  };
}

export function startSimulatedTracking(
  onUpdate: (lat: number, lng: number) => void,
  from: [number, number],
  to: [number, number],
  intervalMs = 4000,
  totalSteps = 60
): () => void {
  let step = 0;
  const timer = setInterval(() => {
    const t = Math.min(step / totalSteps, 1);
    const lat = from[0] + (to[0] - from[0]) * t + (Math.random() - 0.5) * 0.0003;
    const lng = from[1] + (to[1] - from[1]) * t + (Math.random() - 0.5) * 0.0003;
    onUpdate(lat, lng);
    step++;
    if (step >= totalSteps) clearInterval(timer);
  }, intervalMs);
  return () => clearInterval(timer);
}

export async function sendLocationToBackend(
  lat: number,
  lng: number,
  deliveryId: string,
  token: string
): Promise<void> {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://ibrohimjon-bmi.onrender.com/api/v1'}/deliveries/${deliveryId}/location`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ lat, lng }),
    });
  } catch { /* silently fail */ }
}
