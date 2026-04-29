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

export const PICKUP_POINTS: PickupPoint[] = [
  {
    id: 'pp-tashkent-city',
    name: 'Tashkent City Mall',
    address: "Islom Karimov shoh ko'chasi 1",
    district: 'Yakkasaroy',
    lat: 41.3122, lng: 69.2486,
    hours: '10:00 — 22:00',
    type: 'mall',
  },
  {
    id: 'pp-compass',
    name: 'Compass Mall',
    address: "Mustaqillik shoh ko'chasi 71",
    district: "Mirzo Ulug'bek",
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
    address: 'Yunusobod 1-mavze 12',
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
    district: "Mirzo Ulug'bek",
    lat: 41.3434, lng: 69.2500,
    hours: '24/7',
    type: 'locker',
  },
];

export function nearbyPickupPoints(lat: number, lng: number, n = 5): PickupPoint[] {
  return [...PICKUP_POINTS]
    .map((p) => ({ p, d: (p.lat - lat) ** 2 + (p.lng - lng) ** 2 }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map(({ p }) => p);
}
