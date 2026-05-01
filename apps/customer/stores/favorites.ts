'use client';
import { create } from 'zustand';

const KEY = 'lochin.favorites.v1';

type FavoritesState = {
  ids: Set<string>;
  init: () => void;
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  count: () => number;
  clear: () => void;
};

function load(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function save(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {/* ignore */}
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: new Set(),
  init: () => set({ ids: load() }),
  toggle: (productId) =>
    set((state) => {
      const next = new Set(state.ids);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      save(next);
      return { ids: next };
    }),
  has: (productId) => get().ids.has(productId),
  count: () => get().ids.size,
  clear: () => {
    save(new Set());
    set({ ids: new Set() });
  },
}));
