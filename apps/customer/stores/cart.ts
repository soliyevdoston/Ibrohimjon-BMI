'use client';
import { create } from 'zustand';

export type CartItem = {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  sellerId: string;
  imageUrl?: string;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  add: (item: CartItem) => void;
  remove: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clear: () => void;
  subtotal: () => number;
  count: () => number;
  toggleCart: () => void;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,
  add: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    }),
  remove: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),
  updateQty: (productId, qty) =>
    set((state) => ({
      items:
        qty <= 0
          ? state.items.filter((i) => i.productId !== productId)
          : state.items.map((i) =>
              i.productId === productId ? { ...i, quantity: qty } : i
            ),
    })),
  clear: () => set({ items: [] }),
  subtotal: () =>
    get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
  count: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
}));
