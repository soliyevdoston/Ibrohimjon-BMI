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

export function money(v: number) {
  return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
