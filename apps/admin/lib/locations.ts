export type Branch = {
  id: string;
  name: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
  hours: string;
  couriers: number;
  capacity: number;
  status: 'active' | 'busy' | 'closed';
  type: 'main' | 'satellite';
};

export type PickupPoint = {
  id: string;
  name: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
  hours: string;
  type: 'mall' | 'store' | 'kiosk' | 'locker';
};

export const BRANCHES: Branch[] = [];

export const PICKUP_POINTS: PickupPoint[] = [];

export function nearestBranch(lat: number, lng: number): Branch | undefined {
  if (BRANCHES.length === 0) return undefined;
  let min = Infinity;
  let best: Branch = BRANCHES[0];
  for (const b of BRANCHES) {
    const d = (b.lat - lat) ** 2 + (b.lng - lng) ** 2;
    if (d < min) { min = d; best = b; }
  }
  return best;
}

export function nearbyPickupPoints(lat: number, lng: number, n = 5): PickupPoint[] {
  return [...PICKUP_POINTS]
    .map((p) => ({ p, d: (p.lat - lat) ** 2 + (p.lng - lng) ** 2 }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map(({ p }) => p);
}
