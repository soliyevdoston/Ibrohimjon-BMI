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
  revenueToday:     0,
  revenueDelta:     0,
  ordersToday:      0,
  ordersDelta:      0,
  activeDeliveries: 0,
  activeDelta:      0,
  onlineCouriers:   0,
  couriersDelta:    0,
};

export const kpiTrends = {
  revenue:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  orders:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  active:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  couriers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

export const mockRevenueByHour = [
  { h: '09', v: 0 }, { h: '10', v: 0 }, { h: '11', v: 0 },
  { h: '12', v: 0 }, { h: '13', v: 0 }, { h: '14', v: 0 },
  { h: '15', v: 0 }, { h: '16', v: 0 }, { h: '17', v: 0 },
  { h: '18', v: 0 }, { h: '19', v: 0 }, { h: '20', v: 0 },
];

export const mockOrders: MockOrder[] = [];

export const mockCouriers: MockCourier[] = [];

export const mockSellers: MockSeller[] = [];

export const mockCustomers: MockCustomer[] = [];

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
  // Hydration-safe: avoid Intl.NumberFormat (locale data differs between Node and browser)
  const formatted = String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return formatted + ' soʼm';
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
}
