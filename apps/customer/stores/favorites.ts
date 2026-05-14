'use client';
import { create } from 'zustand';
import { api } from '@/lib/api';

const LOCAL_KEY = 'lochin.favorites.v1';

type FavoritesState = {
  ids: Set<string>;
  init: () => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  has: (productId: string) => boolean;
  count: () => number;
  clear: () => void;
};

function loadLocal(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveLocal(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify([...ids])); } catch {/* ignore */}
}

function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('access_token');
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: new Set(),

  init: async () => {
    // Start with cached local IDs for instant UI, then reconcile with server.
    set({ ids: loadLocal() });
    if (!isLoggedIn()) return;
    try {
      const serverIds = await api<string[]>('/favorites/ids');
      const next = new Set(serverIds);
      saveLocal(next);
      set({ ids: next });
    } catch {/* keep local */}
  },

  toggle: async (productId) => {
    // Optimistic — flip locally, then sync.
    const before = new Set(get().ids);
    const next = new Set(before);
    if (next.has(productId)) next.delete(productId);
    else next.add(productId);
    saveLocal(next);
    set({ ids: next });

    if (!isLoggedIn()) return;
    try {
      await api(`/favorites/${productId}/toggle`, { method: 'POST' });
    } catch {
      // Roll back on failure
      saveLocal(before);
      set({ ids: before });
    }
  },

  has: (productId) => get().ids.has(productId),
  count: () => get().ids.size,
  clear: () => {
    saveLocal(new Set());
    set({ ids: new Set() });
  },
}));
