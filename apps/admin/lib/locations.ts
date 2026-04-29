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

export const BRANCHES: Branch[] = [
  {
    id: 'br-yunusobod',
    name: 'Lochin Markaziy ombor',
    address: "Amir Temur ko'chasi 107A",
    district: 'Yunusobod',
    lat: 41.3656, lng: 69.2867,
    hours: '24/7',
    couriers: 24, capacity: 30,
    status: 'active', type: 'main',
  },
  {
    id: 'br-chilonzor',
    name: 'Chilonzor filiali',
    address: "Bunyodkor shoh ko'chasi 12",
    district: 'Chilonzor',
    lat: 41.2756, lng: 69.2034,
    hours: '07:00 — 23:00',
    couriers: 18, capacity: 20,
    status: 'busy', type: 'main',
  },
  {
    id: 'br-mirzo-ulugbek',
    name: 'Mirzo Ulug\'bek filiali',
    address: "Mustaqillik shoh ko'chasi 78",
    district: 'Mirzo Ulug\'bek',
    lat: 41.3275, lng: 69.3415,
    hours: '07:00 — 23:00',
    couriers: 14, capacity: 18,
    status: 'active', type: 'main',
  },
  {
    id: 'br-sergeli',
    name: 'Sergeli filiali',
    address: "Yangi Sergeli ko'chasi 4",
    district: 'Sergeli',
    lat: 41.2298, lng: 69.2156,
    hours: '08:00 — 22:00',
    couriers: 9, capacity: 14,
    status: 'active', type: 'satellite',
  },
  {
    id: 'br-olmazor',
    name: 'Olmazor filiali',
    address: "Farobiy ko'chasi 22",
    district: 'Olmazor',
    lat: 41.3501, lng: 69.2186,
    hours: '08:00 — 22:00',
    couriers: 11, capacity: 16,
    status: 'active', type: 'satellite',
  },
  {
    id: 'br-yashnobod',
    name: 'Yashnobod filiali',
    address: "Avtozavod ko'chasi 19",
    district: 'Yashnobod',
    lat: 41.3081, lng: 69.3289,
    hours: '08:00 — 22:00',
    couriers: 8, capacity: 12,
    status: 'busy', type: 'satellite',
  },
  {
    id: 'br-shayxontohur',
    name: 'Shayxontohur filiali',
    address: "Beruniy ko'chasi 51",
    district: 'Shayxontohur',
    lat: 41.3299, lng: 69.2364,
    hours: '07:00 — 23:00',
    couriers: 12, capacity: 16,
    status: 'active', type: 'satellite',
  },
];

export const PICKUP_POINTS: PickupPoint[] = [
  {
    id: 'pp-tashkent-city',
    name: 'Tashkent City Mall',
    address: 'Islom Karimov shoh ko\'chasi 1',
    district: 'Yakkasaroy',
    lat: 41.3122, lng: 69.2486,
    hours: '10:00 — 22:00',
    type: 'mall',
  },
  {
    id: 'pp-compass',
    name: 'Compass Mall',
    address: "Mustaqillik shoh ko'chasi 71",
    district: 'Mirzo Ulug\'bek',
    lat: 41.3050, lng: 69.2733,
    hours: '10:00 — 22:00',
    type: 'mall',
  },
  {
    id: 'pp-magic-city',
    name: 'Magic City',
    address: "Amir Temur ko'chasi 60",
    district: 'Yunusobod',
    lat: 41.2989, lng: 69.2511,
    hours: '10:00 — 23:00',
    type: 'mall',
  },
  {
    id: 'pp-samarqand-darvoza',
    name: 'Samarqand Darvoza',
    address: "Koratosh ko'chasi 13",
    district: 'Shayxontohur',
    lat: 41.3036, lng: 69.2444,
    hours: '09:00 — 22:00',
    type: 'mall',
  },
  {
    id: 'pp-next-mall',
    name: 'Next Mall',
    address: "Sayilgoh ko'chasi 38",
    district: 'Yunusobod',
    lat: 41.3656, lng: 69.3186,
    hours: '10:00 — 22:00',
    type: 'mall',
  },
  {
    id: 'pp-mehrgon',
    name: 'Mehrgon Plaza',
    address: "Olmazor ko'chasi 3",
    district: 'Olmazor',
    lat: 41.2994, lng: 69.2756,
    hours: '09:00 — 22:00',
    type: 'mall',
  },
  {
    id: 'pp-korzinka-yunusobod',
    name: 'Korzinka Yunusobod',
    address: "Yunusobod 1-mavze 12",
    district: 'Yunusobod',
    lat: 41.3667, lng: 69.2900,
    hours: '07:00 — 23:00',
    type: 'store',
  },
  {
    id: 'pp-maxima-chilonzor',
    name: 'Maxima Chilonzor',
    address: 'Chilonzor 19-mavze 8',
    district: 'Chilonzor',
    lat: 41.2825, lng: 69.2056,
    hours: '08:00 — 22:00',
    type: 'store',
  },
  {
    id: 'pp-bunyodkor',
    name: 'Bunyodkor punkti',
    address: 'Bunyodkor maydoni 2',
    district: 'Chilonzor',
    lat: 41.2872, lng: 69.2200,
    hours: '08:00 — 21:00',
    type: 'kiosk',
  },
  {
    id: 'pp-rivera',
    name: 'Rivera Lavanda Locker',
    address: "Bog'ishamol ko'chasi 14",
    district: 'Mirzo Ulug\'bek',
    lat: 41.3434, lng: 69.2500,
    hours: '24/7',
    type: 'locker',
  },
];

export function nearestBranch(lat: number, lng: number): Branch {
  let min = Infinity;
  let best = BRANCHES[0];
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
