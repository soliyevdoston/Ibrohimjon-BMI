'use client';
import { create } from 'zustand';

type AuthState = {
  accessToken: string | null;
  role: string | null;
  setAuth: (token: string, role: string) => void;
  clear: () => void;
  init: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  role: null,
  setAuth: (accessToken, role) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('role', role);
    set({ accessToken, role });
  },
  clear: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    set({ accessToken: null, role: null });
  },
  init: () => {
    const accessToken = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    if (accessToken) set({ accessToken, role });
  },
}));
