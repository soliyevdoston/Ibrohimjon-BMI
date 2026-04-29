const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? '';

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error((err as { message?: string }).message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export function money(value: number) {
  return new Intl.NumberFormat('uz-UZ').format(value);
}

type MapTilerFeature = {
  place_name?: string;
  text?: string;
  center?: [number, number]; // [lng, lat]
};

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // Prefer MapTiler — faster, supports country/language filters cleanly
  if (MAPTILER_KEY) {
    try {
      const res = await fetch(
        `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAPTILER_KEY}&language=uz`
      );
      if (res.ok) {
        const data = (await res.json()) as { features?: MapTilerFeature[] };
        const place = data.features?.[0]?.place_name;
        if (place) return place;
      }
    } catch {/* fall through to Nominatim */}
  }
  // Fallback: Nominatim (no key needed)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=uz,en`,
      { headers: { 'User-Agent': 'LochinDelivery/1.0' } }
    );
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export type PlaceSuggestion = {
  label: string;
  lat: number;
  lng: number;
};

const TASHKENT_PROXIMITY = '69.2401,41.2995';

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  if (query.trim().length < 2) return [];

  if (MAPTILER_KEY) {
    try {
      const url =
        `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json` +
        `?key=${MAPTILER_KEY}&country=uz&limit=6&proximity=${TASHKENT_PROXIMITY}&language=uz`;
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as { features?: MapTilerFeature[] };
        return (data.features ?? [])
          .filter((f) => f.center && Array.isArray(f.center))
          .map((f) => ({
            label: f.place_name ?? f.text ?? '',
            lat: f.center![1],
            lng: f.center![0],
          }));
      }
    } catch {/* fall through */}
  }

  // Fallback: Nominatim
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&countrycodes=uz&limit=6&accept-language=uz,en`,
      { headers: { 'User-Agent': 'LochinDelivery/1.0' } }
    );
    const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    return data.map((d) => ({
      label: d.display_name,
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
    }));
  } catch {
    return [];
  }
}
