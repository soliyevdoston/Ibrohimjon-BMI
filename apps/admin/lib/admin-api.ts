'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

// ---------- Stats ----------

export type AdminStats = {
  kpis: {
    revenueToday: number;
    revenueDelta: number;
    ordersToday: number;
    ordersDelta: number;
    activeDeliveries: number;
    activeDelta: number;
    onlineCouriers: number;
    busyCouriers: number;
    couriersDelta: number;
  };
  totals: {
    couriers: number;
    sellers: number;
    customers: number;
    products: number;
    orders: number;
  };
  revenueByHour: { h: string; v: number }[];
  revenueByDay: { h: string; v: number }[];
  statusDistribution: { status: string; count: number }[];
  topSellers: { id: string; brand: string; owner: string; ordersToday: number; revenueToday: number }[];
  revenueMonth: number;
  avgDeliveryMinutes: number;
  generatedAt: string;
};

export function useAdminStats(pollMs = 15000) {
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const stats = await api<AdminStats>('/admin/stats');
      setData(stats);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    if (!pollMs) return;
    const id = setInterval(load, pollMs);
    return () => clearInterval(id);
  }, [load, pollMs]);

  return { data, loading, error, refetch: load };
}

// ---------- Generic list hook ----------

function useApiList<T>(path: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<T[] | { items: T[] }>(path);
      const list = Array.isArray(data) ? data : (data.items ?? []);
      setItems(list);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, refetch: load };
}

// ---------- Domain types (matching backend shape) ----------

export type ApiUser = {
  id: string;
  phone: string | null;
  email: string | null;
  fullName: string | null;
  role: 'ADMIN' | 'SELLER' | 'COURIER' | 'CUSTOMER';
  status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  createdAt: string;
};

export type ApiSeller = {
  id: string;
  userId: string;
  legalName: string;
  brandName: string;
  description: string | null;
  isActive: boolean;
  rating: number;
  addressText: string | null;
  addressLat: string | null;
  addressLng: string | null;
  createdAt: string;
  user: ApiUser;
};

export type ApiCourier = {
  id: string;
  userId: string;
  vehicleType: 'BIKE' | 'CAR' | 'VAN' | 'TRUCK';
  vehicleModel: string | null;
  vehiclePlate: string | null;
  maxLoadKg: string;
  isOnline: boolean;
  isAvailable: boolean;
  currentLat: string | null;
  currentLng: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  user: ApiUser;
};

export type ApiOrderItem = {
  id: string;
  titleSnapshot: string;
  priceSnapshot: string;
  quantity: number;
  totalAmount: string;
};

export type ApiOrder = {
  id: string;
  customerId: string;
  sellerId: string;
  status: string;
  totalAmount: string;
  deliveryFeeAmount: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddressText: string;
  createdAt: string;
  items: ApiOrderItem[];
  delivery?: { id: string; status: string; courierId: string | null } | null;
  payment?: { id: string; status: string } | null;
};

export type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type ApiProduct = {
  id: string;
  sellerId: string;
  categoryId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
  category?: ApiCategory;
  seller?: { id: string; brandName: string; rating: number };
};

// ---------- Hooks ----------

export function useApiUsers()     { return useApiList<ApiUser>('/admin/users'); }
export function useApiSellers()   { return useApiList<ApiSeller>('/admin/sellers'); }
export function useApiCouriers()  { return useApiList<ApiCourier>('/admin/couriers'); }
export function useApiOrders()    { return useApiList<ApiOrder>('/admin/orders'); }
export function useApiCategories(){ return useApiList<ApiCategory>('/products/categories'); }

export function useApiProducts() {
  const [items, setItems] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ items: ApiProduct[]; meta: { total: number } }>('/products?limit=200');
      setItems(data.items ?? []);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { items, loading, error, refetch: load };
}

// ---------- Helpers ----------

export function numFromStr(s: string | number | null | undefined): number {
  if (s == null) return 0;
  return typeof s === 'number' ? s : Number(s);
}

export function customerCount(users: ApiUser[]) {
  return users.filter((u) => u.role === 'CUSTOMER').length;
}

// ---------- Admin write actions ----------

export function createSellerApi(body: {
  email: string;
  password: string;
  fullName?: string;
  brandName: string;
  legalName: string;
  phone?: string;
  description?: string;
  addressText?: string;
  addressLat?: number;
  addressLng?: number;
}) {
  return api<{ user: ApiUser; seller: ApiSeller }>('/admin/sellers', {
    method: 'POST',
    body,
  });
}

export function createCourierApi(body: {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  vehicleType?: 'BIKE' | 'CAR' | 'VAN' | 'TRUCK';
  vehicleModel?: string;
  vehiclePlate?: string;
  maxLoadKg?: number;
}) {
  return api<{ user: ApiUser; courier: ApiCourier }>('/admin/couriers', {
    method: 'POST',
    body,
  });
}

export function setSellerActiveApi(id: string, isActive: boolean) {
  return api<ApiSeller>(`/admin/sellers/${id}/active`, {
    method: 'PATCH',
    body: { isActive },
  });
}

export function deleteSellerApi(id: string) {
  return api<ApiSeller>(`/admin/sellers/${id}`, { method: 'DELETE' });
}
