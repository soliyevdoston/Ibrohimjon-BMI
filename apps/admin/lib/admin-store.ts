'use client';
import { useEffect, useState, useCallback } from 'react';
import { BRANCHES as SEED_BRANCHES, PICKUP_POINTS as SEED_PICKUPS, type Branch, type PickupPoint } from './locations';
import { mockCouriers, mockSellers, mockCustomers, mockOrders, type MockCourier, type MockSeller, type MockCustomer, type MockOrder } from './admin-mock';

export type { Branch, PickupPoint, MockCourier, MockSeller, MockCustomer, MockOrder };

export type Category = {
  id: string;
  name: string;
  icon: string;
  parentId: string | null;
  productCount: number;
};

export type Product = {
  id: string;
  title: string;
  sellerId: string;
  sellerName: string;
  categoryId: string;
  price: number;
  stock: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

const SEED_CATEGORIES: Category[] = [
  { id: 'cat-bakery',      name: 'Tortlar',          icon: '🎂', parentId: null, productCount: 6  },
  { id: 'cat-drinks',      name: 'Ichimliklar',      icon: '🥤', parentId: null, productCount: 4  },
  { id: 'cat-sweets',      name: 'Shirinliklar',     icon: '🍫', parentId: null, productCount: 6  },
  { id: 'cat-pharmacy',    name: 'Dorixona',         icon: '💊', parentId: null, productCount: 5  },
  { id: 'cat-electronics', name: 'Texnika',          icon: '📱', parentId: null, productCount: 10 },
  { id: 'cat-home',        name: "Uy-ro'zg'or",      icon: '🏠', parentId: null, productCount: 4  },
  { id: 'cat-beauty',      name: "Go'zallik",        icon: '💄', parentId: null, productCount: 4  },
];

const SEED_PRODUCTS: Product[] = [
  { id: 'p1',  title: 'Shokoladli tort',         sellerId: 's1', sellerName: 'Lochin Market', categoryId: 'cat-bakery',      price: 95000,    stock: 15, status: 'approved', createdAt: '2025-04-12' },
  { id: 'p2',  title: 'Cheesecake',               sellerId: 's1', sellerName: 'Lochin Market', categoryId: 'cat-bakery',      price: 110000,   stock: 10, status: 'approved', createdAt: '2025-04-15' },
  { id: 'p3',  title: 'Tiramisu',                 sellerId: 's1', sellerName: 'Lochin Market', categoryId: 'cat-bakery',      price: 92000,    stock: 14, status: 'approved', createdAt: '2025-04-09' },
  { id: 'p4',  title: 'Coca-Cola 1L',             sellerId: 's1', sellerName: 'Lochin Market', categoryId: 'cat-drinks',      price: 15000,    stock: 200, status: 'approved', createdAt: '2025-04-08' },
  { id: 'p5',  title: 'Mineral suv 1.5L',         sellerId: 's1', sellerName: 'Lochin Market', categoryId: 'cat-drinks',      price: 8000,     stock: 250, status: 'approved', createdAt: '2025-04-07' },
  { id: 'p6',  title: 'Shokolad Lindt',           sellerId: 's1', sellerName: 'Lochin Market', categoryId: 'cat-sweets',      price: 38000,    stock: 80,  status: 'approved', createdAt: '2025-04-20' },
  { id: 'p7',  title: 'Asal (500g)',              sellerId: 's1', sellerName: 'Lochin Market', categoryId: 'cat-sweets',      price: 75000,    stock: 60,  status: 'approved', createdAt: '2025-04-26' },
  { id: 'p8',  title: 'Vitamin C',                sellerId: 's1', sellerName: 'Lochin Market', categoryId: 'cat-pharmacy',    price: 35000,    stock: 100, status: 'approved', createdAt: '2025-04-27' },
  { id: 'p9',  title: 'iPhone 15 Pro 256GB',     sellerId: 's1', sellerName: 'Lochin Market', categoryId: 'cat-electronics', price: 14500000, stock: 8,   status: 'approved', createdAt: '2025-04-28' },
  { id: 'p10', title: 'AirPods Pro 2',            sellerId: 's1', sellerName: 'Lochin Market', categoryId: 'cat-electronics', price: 3200000,  stock: 25,  status: 'pending',  createdAt: '2025-04-29' },
];

type EntityCourier = MockCourier & { branchId?: string };
type EntitySeller = MockSeller & { categoryId?: string; lat?: number; lng?: number; address?: string };
type EntityCustomer = MockCustomer & { isBlocked?: boolean };

const KEYS = {
  branches: 'admin.branches.v1',
  pickups: 'admin.pickups.v1',
  couriers: 'admin.couriers.v1',
  sellers: 'admin.sellers.v1',
  customers: 'admin.customers.v1',
  categories: 'admin.categories.v2',
  products: 'admin.products.v2',
  orders: 'admin.orders.v1',
} as const;

function loadOrSeed<T>(key: string, seed: T[]): T[] {
  if (typeof window === 'undefined') return seed;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T[];
  } catch {/* ignore */}
  return seed;
}

function save<T>(key: string, data: T[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {/* ignore */}
  // Notify same-tab listeners
  window.dispatchEvent(new CustomEvent(`admin-store:${key}`));
}

function useEntityStore<T extends { id: string }>(key: string, seed: T[]) {
  const [items, setItems] = useState<T[]>(seed);

  useEffect(() => {
    setItems(loadOrSeed<T>(key, seed));
    const onUpdate = () => setItems(loadOrSeed<T>(key, seed));
    window.addEventListener(`admin-store:${key}`, onUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === key) onUpdate();
    });
    return () => {
      window.removeEventListener(`admin-store:${key}`, onUpdate);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const add = useCallback((item: T) => {
    const next = [item, ...loadOrSeed<T>(key, seed)];
    save(key, next);
    setItems(next);
  }, [key, seed]);

  const update = useCallback((id: string, patch: Partial<T>) => {
    const current = loadOrSeed<T>(key, seed);
    const next = current.map((x) => (x.id === id ? { ...x, ...patch } : x));
    save(key, next);
    setItems(next);
  }, [key, seed]);

  const remove = useCallback((id: string) => {
    const next = loadOrSeed<T>(key, seed).filter((x) => x.id !== id);
    save(key, next);
    setItems(next);
  }, [key, seed]);

  const reset = useCallback(() => {
    save(key, seed);
    setItems(seed);
  }, [key, seed]);

  return { items, add, update, remove, reset };
}

export function useOrders()    { return useEntityStore<MockOrder>(KEYS.orders, mockOrders); }
export function useBranches()  { return useEntityStore<Branch>(KEYS.branches, SEED_BRANCHES); }
export function usePickups()   { return useEntityStore<PickupPoint>(KEYS.pickups, SEED_PICKUPS); }
export function useCouriers()  { return useEntityStore<EntityCourier>(KEYS.couriers, mockCouriers); }
export function useSellers()   { return useEntityStore<EntitySeller>(KEYS.sellers, mockSellers); }
export function useCustomers() { return useEntityStore<EntityCustomer>(KEYS.customers, mockCustomers); }
export function useCategories() { return useEntityStore<Category>(KEYS.categories, SEED_CATEGORIES); }
export function useProducts()  { return useEntityStore<Product>(KEYS.products, SEED_PRODUCTS); }

export function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// Snapshot helpers (used outside React, e.g. on initial render of map)
export function snapshotBranches(): Branch[] {
  return loadOrSeed<Branch>(KEYS.branches, SEED_BRANCHES);
}
export function snapshotPickups(): PickupPoint[] {
  return loadOrSeed<PickupPoint>(KEYS.pickups, SEED_PICKUPS);
}
