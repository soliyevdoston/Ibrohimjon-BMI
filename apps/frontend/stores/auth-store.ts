'use client';

import { create } from 'zustand';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  role: 'ADMIN' | 'SELLER' | 'COURIER' | 'CUSTOMER' | null;
  setAuth: (payload: { accessToken: string; refreshToken: string; role: AuthState['role'] }) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  role: null,
  setAuth: ({ accessToken, refreshToken, role }) => set({ accessToken, refreshToken, role }),
  clear: () => set({ accessToken: null, refreshToken: null, role: null }),
}));
