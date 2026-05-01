// Production deploy first — falls back to localhost only when explicitly set.
const PROD_API = 'https://ibrohimjon-bmi.onrender.com/api/v1';
const BASE = process.env.NEXT_PUBLIC_API_URL || PROD_API;

export const API_BASE_URL = BASE;
export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || 'https://ibrohimjon-bmi.onrender.com';

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {}
): Promise<T> {
  let token = options.token;
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('access_token') ?? undefined;
  }

  const res = await fetch(`${BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    if (!window.location.pathname.startsWith('/login')) {
      const back = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.replace(`/login?redirect=${back}`);
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error((err as { message?: string }).message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export function money(value: number) {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function timeAgo(date: string | Date): string {
  const now = Date.now();
  const d = new Date(date).getTime();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString('uz-UZ');
}
