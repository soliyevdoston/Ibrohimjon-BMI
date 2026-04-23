export type Status =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'COURIER_ACCEPTED'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELED'
  | 'FAILED';

export type MockOrder = {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  sellerName: string;
  courierName: string | null;
  status: Status;
  total: number;
  itemsCount: number;
  placedAt: string;
  city: string;
};

export type MockCourier = {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  isOnline: boolean;
  isBusy: boolean;
  rating: number;
  deliveriesToday: number;
  zone: string;
};

export type MockSeller = {
  id: string;
  brand: string;
  owner: string;
  phone: string;
  isActive: boolean;
  rating: number;
  productsCount: number;
  ordersToday: number;
  revenueToday: number;
};

export type MockCustomer = {
  id: string;
  name: string;
  phone: string;
  isVerified: boolean;
  ordersCount: number;
  spend: number;
  lastActive: string;
};

export const mockKPIs = {
  revenueToday:       34820000,
  revenueDelta:       +12.4,
  ordersToday:        248,
  ordersDelta:        +8.1,
  activeDeliveries:   37,
  activeDelta:        -3.5,
  onlineCouriers:     54,
  couriersDelta:      +2.0,
};

export const mockRevenueByHour = [
  { h: '09', v: 1.2 }, { h: '10', v: 1.9 }, { h: '11', v: 2.4 },
  { h: '12', v: 3.6 }, { h: '13', v: 4.1 }, { h: '14', v: 3.2 },
  { h: '15', v: 2.8 }, { h: '16', v: 3.5 }, { h: '17', v: 4.4 },
  { h: '18', v: 5.3 }, { h: '19', v: 4.7 }, { h: '20', v: 3.1 },
];

export const mockOrders: MockOrder[] = [
  {
    id: 'o1', code: '#A-20481',
    customerName: 'Aziza Karimova', customerPhone: '+998 90 123-45-67',
    sellerName: 'Bro Coffee', courierName: 'Jasur T.',
    status: 'ON_THE_WAY', total: 142000, itemsCount: 3,
    placedAt: '12 min ago', city: 'Tashkent',
  },
  {
    id: 'o2', code: '#A-20480',
    customerName: 'Bekzod Aliev', customerPhone: '+998 94 222-11-33',
    sellerName: 'Korzinka Express', courierName: 'Sherzod M.',
    status: 'PICKED_UP', total: 87500, itemsCount: 2,
    placedAt: '18 min ago', city: 'Tashkent',
  },
  {
    id: 'o3', code: '#A-20479',
    customerName: 'Dilnoza Yusupova', customerPhone: '+998 97 876-54-32',
    sellerName: 'Plov Center', courierName: null,
    status: 'READY_FOR_PICKUP', total: 64000, itemsCount: 1,
    placedAt: '22 min ago', city: 'Tashkent',
  },
  {
    id: 'o4', code: '#A-20478',
    customerName: 'Rustam Xolmatov', customerPhone: '+998 99 100-20-30',
    sellerName: 'Evos', courierName: 'Nodir K.',
    status: 'DELIVERED', total: 52000, itemsCount: 2,
    placedAt: '31 min ago', city: 'Samarkand',
  },
  {
    id: 'o5', code: '#A-20477',
    customerName: 'Madina S.', customerPhone: '+998 91 555-00-11',
    sellerName: 'Max Burger', courierName: 'Aziz R.',
    status: 'PREPARING', total: 108000, itemsCount: 4,
    placedAt: '34 min ago', city: 'Tashkent',
  },
  {
    id: 'o6', code: '#A-20476',
    customerName: 'Sardor M.', customerPhone: '+998 93 111-44-55',
    sellerName: 'Chaikhana Nur', courierName: null,
    status: 'PENDING', total: 210000, itemsCount: 5,
    placedAt: '36 min ago', city: 'Bukhara',
  },
  {
    id: 'o7', code: '#A-20475',
    customerName: 'Otabek U.', customerPhone: '+998 99 321-54-76',
    sellerName: 'Havva Bakery', courierName: 'Laziz P.',
    status: 'DELIVERED', total: 36000, itemsCount: 2,
    placedAt: '48 min ago', city: 'Tashkent',
  },
  {
    id: 'o8', code: '#A-20474',
    customerName: 'Feruza K.', customerPhone: '+998 90 700-80-90',
    sellerName: 'Bro Coffee', courierName: null,
    status: 'CANCELED', total: 29000, itemsCount: 1,
    placedAt: '52 min ago', city: 'Tashkent',
  },
];

export const mockCouriers: MockCourier[] = [
  { id: 'c1', name: 'Jasur Tursunov',   phone: '+998 90 111-22-33', vehicle: 'Scooter',  isOnline: true,  isBusy: true,  rating: 4.9, deliveriesToday: 12, zone: 'Chilonzor' },
  { id: 'c2', name: 'Sherzod Mirzaev',  phone: '+998 93 222-33-44', vehicle: 'Motorbike',isOnline: true,  isBusy: true,  rating: 4.8, deliveriesToday: 11, zone: 'Yunusobod' },
  { id: 'c3', name: 'Nodir Karimov',    phone: '+998 94 333-44-55', vehicle: 'Car',      isOnline: true,  isBusy: false, rating: 4.7, deliveriesToday: 9,  zone: 'Mirzo Ulugbek' },
  { id: 'c4', name: 'Aziz Rasulov',     phone: '+998 91 444-55-66', vehicle: 'Bicycle',  isOnline: true,  isBusy: true,  rating: 4.9, deliveriesToday: 14, zone: 'Shaykhontohur' },
  { id: 'c5', name: 'Laziz Pulatov',    phone: '+998 97 555-66-77', vehicle: 'Scooter',  isOnline: true,  isBusy: false, rating: 4.6, deliveriesToday: 7,  zone: 'Sergeli' },
  { id: 'c6', name: 'Bobur Saidov',     phone: '+998 99 666-77-88', vehicle: 'Motorbike',isOnline: false, isBusy: false, rating: 4.5, deliveriesToday: 0,  zone: 'Yakkasaroy' },
  { id: 'c7', name: 'Oybek Norov',      phone: '+998 90 777-88-99', vehicle: 'Car',      isOnline: true,  isBusy: false, rating: 4.8, deliveriesToday: 6,  zone: 'Almazar' },
  { id: 'c8', name: 'Ulugbek Mahmudov', phone: '+998 93 888-99-00', vehicle: 'Scooter',  isOnline: false, isBusy: false, rating: 4.3, deliveriesToday: 0,  zone: 'Bektemir' },
];

export const mockSellers: MockSeller[] = [
  { id: 's1', brand: 'Bro Coffee',        owner: 'Jamshid A.', phone: '+998 90 101-01-01', isActive: true,  rating: 4.9, productsCount: 42,  ordersToday: 38, revenueToday: 5_420_000 },
  { id: 's2', brand: 'Korzinka Express',  owner: 'Nilufar R.', phone: '+998 93 202-02-02', isActive: true,  rating: 4.7, productsCount: 218, ordersToday: 62, revenueToday: 9_840_000 },
  { id: 's3', brand: 'Plov Center',       owner: 'Akmal X.',   phone: '+998 94 303-03-03', isActive: true,  rating: 4.8, productsCount: 16,  ordersToday: 24, revenueToday: 3_120_000 },
  { id: 's4', brand: 'Evos',              owner: 'Dilshod Y.', phone: '+998 91 404-04-04', isActive: true,  rating: 4.6, productsCount: 64,  ordersToday: 31, revenueToday: 4_140_000 },
  { id: 's5', brand: 'Max Burger',        owner: 'Rasul K.',   phone: '+998 97 505-05-05', isActive: true,  rating: 4.5, productsCount: 28,  ordersToday: 27, revenueToday: 3_760_000 },
  { id: 's6', brand: 'Chaikhana Nur',     owner: 'Olim S.',    phone: '+998 99 606-06-06', isActive: false, rating: 4.4, productsCount: 52,  ordersToday: 0,  revenueToday: 0 },
  { id: 's7', brand: 'Havva Bakery',      owner: 'Gulnora M.', phone: '+998 90 707-07-07', isActive: true,  rating: 4.7, productsCount: 34,  ordersToday: 19, revenueToday: 2_180_000 },
];

export const mockCustomers: MockCustomer[] = [
  { id: 'u1', name: 'Aziza Karimova',   phone: '+998 90 123-45-67', isVerified: true,  ordersCount: 47, spend: 4_210_000, lastActive: '2m ago' },
  { id: 'u2', name: 'Bekzod Aliev',     phone: '+998 94 222-11-33', isVerified: true,  ordersCount: 29, spend: 2_860_000, lastActive: '14m ago' },
  { id: 'u3', name: 'Dilnoza Yusupova', phone: '+998 97 876-54-32', isVerified: true,  ordersCount: 18, spend: 1_720_000, lastActive: '22m ago' },
  { id: 'u4', name: 'Rustam Xolmatov',  phone: '+998 99 100-20-30', isVerified: false, ordersCount: 3,  spend:   240_000, lastActive: '1h ago' },
  { id: 'u5', name: 'Madina Sobirova',  phone: '+998 91 555-00-11', isVerified: true,  ordersCount: 61, spend: 6_430_000, lastActive: '3h ago' },
  { id: 'u6', name: 'Sardor Mansurov',  phone: '+998 93 111-44-55', isVerified: true,  ordersCount: 12, spend: 1_130_000, lastActive: '5h ago' },
  { id: 'u7', name: 'Feruza Komilova',  phone: '+998 90 700-80-90', isVerified: true,  ordersCount: 8,  spend:   690_000, lastActive: 'yesterday' },
  { id: 'u8', name: 'Otabek Usmonov',   phone: '+998 99 321-54-76', isVerified: false, ordersCount: 1,  spend:    42_000, lastActive: '2d ago' },
];

export const statusChip: Record<Status, { label: string; tone: string }> = {
  PENDING:          { label: 'Pending',       tone: 'gray' },
  ACCEPTED:         { label: 'Accepted',      tone: 'indigo' },
  PREPARING:        { label: 'Preparing',     tone: 'amber' },
  READY_FOR_PICKUP: { label: 'Ready',         tone: 'sky' },
  COURIER_ACCEPTED: { label: 'Courier set',   tone: 'indigo' },
  PICKED_UP:        { label: 'Picked up',     tone: 'sky' },
  ON_THE_WAY:       { label: 'On the way',    tone: 'indigo' },
  DELIVERED:        { label: 'Delivered',     tone: 'green' },
  CANCELED:         { label: 'Canceled',      tone: 'rose' },
  FAILED:           { label: 'Failed',        tone: 'rose' },
};

export function uzs(value: number) {
  return new Intl.NumberFormat('uz-UZ').format(value) + ' soʼm';
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
}
