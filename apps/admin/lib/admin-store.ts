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

const SEED_CATEGORIES: Category[] = [];

const SEED_PRODUCTS: Product[] = [];

type EntityCourier = MockCourier & { branchId?: string };
type EntitySeller = MockSeller & { categoryId?: string; lat?: number; lng?: number; address?: string };
type EntityCustomer = MockCustomer & { isBlocked?: boolean };

// Bumped to v-clean so any pre-existing demo data stuck in users' localStorage
// is invalidated on next load (project handover state).
const KEYS = {
  branches: 'admin.branches.v-clean',
  pickups: 'admin.pickups.v-clean',
  couriers: 'admin.couriers.v-clean',
  sellers: 'admin.sellers.v-clean',
  customers: 'admin.customers.v-clean',
  categories: 'admin.categories.v-clean',
  products: 'admin.products.v-clean',
  orders: 'admin.orders.v-clean',
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
