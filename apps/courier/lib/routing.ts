export type RouteResult = {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
};

const cache = new Map<string, RouteResult | null>();

function cacheKey(points: [number, number][]): string {
  return points.map((p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join(';');
}

export async function fetchRoute(
  points: [number, number][]
): Promise<RouteResult | null> {
  if (points.length < 2) return null;
  const key = cacheKey(points);
  if (cache.has(key)) return cache.get(key)!;

  const coords = points.map((p) => `${p[1]},${p[0]}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      cache.set(key, null);
      return null;
    }
    const data: {
      routes?: Array<{
        geometry: { coordinates: [number, number][] };
        distance: number;
        duration: number;
      }>;
    } = await res.json();
    const route = data.routes?.[0];
    if (!route) {
      cache.set(key, null);
      return null;
    }
    const result: RouteResult = {
      coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
      distanceMeters: route.distance,
      durationSeconds: route.duration,
    };
    cache.set(key, result);
    return result;
  } catch {
    cache.set(key, null);
    return null;
  }
}
