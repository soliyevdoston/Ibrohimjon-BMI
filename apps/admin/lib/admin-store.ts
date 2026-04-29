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
  { id: 'cat-food',     name: 'Oziq-ovqat',       icon: '🍔', parentId: null, productCount: 124 },
  { id: 'cat-grocery',  name: "Oziq-ovqat do'koni", icon: '🛒', parentId: null, productCount: 286 },
  { id: 'cat-bakery',   name: 'Non mahsulotlari',  icon: '🥖', parentId: null, productCount: 42 },
  { id: 'cat-drinks',   name: 'Ichimliklar',       icon: '🥤', parentId: null, productCount: 67 },
  { id: 'cat-pharmacy', name: 'Dorixona',          icon: '💊', parentId: null, productCount: 88 },
  { id: 'cat-flowers',  name: 'Gullar',            icon: '💐', parentId: null, productCount: 23 },
  { id: 'cat-meat',     name: "Go'sht mahsulotlari", icon: '🥩', parentId: 'cat-grocery', productCount: 31 },
  { id: 'cat-fruits',   name: 'Mevalar',           icon: '🍎', parentId: 'cat-grocery', productCount: 54 },
];

const SEED_PRODUCTS: Product[] = [
  { id: 'p1', title: 'Cappuccino 250ml',    sellerId: 's1', sellerName: 'Bro Coffee',       categoryId: 'cat-drinks',  price: 28000, stock: 100, status: 'approved', createdAt: '2025-04-12' },
  { id: 'p2', title: 'Plov (oddiy)',         sellerId: 's3', sellerName: 'Plov Center',      categoryId: 'cat-food',    price: 38000, stock: 50,  status: 'approved', createdAt: '2025-04-10' },
  { id: 'p3', title: 'Lavash mol go\'shti', sellerId: 's4', sellerName: 'Evos',              categoryId: 'cat-food',    price: 32000, stock: 80,  status: 'approved', createdAt: '2025-04-15' },
  { id: 'p4', title: 'Burger Big Max',       sellerId: 's5', sellerName: 'Max Burger',       categoryId: 'cat-food',    price: 42000, stock: 60,  status: 'approved', createdAt: '2025-04-09' },
  { id: 'p5', title: 'Kola 1L',              sellerId: 's2', sellerName: 'Korzinka Express', categoryId: 'cat-drinks',  price: 15000, stock: 200, status: 'approved', createdAt: '2025-04-08' },
  { id: 'p6', title: 'Suzma 200g',           sellerId: 's2', sellerName: 'Korzinka Express', categoryId: 'cat-grocery', price: 18000, stock: 150, status: 'approved', createdAt: '2025-04-07' },
  { id: 'p7', title: 'Non Patir',            sellerId: 's7', sellerName: 'Havva Bakery',     categoryId: 'cat-bakery',  price: 8000,  stock: 300, status: 'approved', createdAt: '2025-04-20' },
  { id: 'p8', title: 'Choy Lipton',          sellerId: 's6', sellerName: 'Chaikhana Nur',    categoryId: 'cat-drinks',  price: 12000, stock: 100, status: 'pending',  createdAt: '2025-04-26' },
  { id: 'p9', title: 'Yangi mahsulot',       sellerId: 's1', sellerName: 'Bro Coffee',       categoryId: 'cat-drinks',  price: 35000, stock: 40,  status: 'pending',  createdAt: '2025-04-27' },
  { id: 'p10', title: 'Chocolate cake',      sellerId: 's7', sellerName: 'Havva Bakery',     categoryId: 'cat-bakery',  price: 95000, stock: 12,  status: 'pending',  createdAt: '2025-04-28' },
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
  categories: 'admin.categories.v1',
  products: 'admin.products.v1',
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
