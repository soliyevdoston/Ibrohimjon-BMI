'use client';
import { create } from 'zustand';

type AuthState = {
  accessToken: string | null;
  role: string | null;
  name: string | null;
  setAuth: (token: string, role: string, name?: string) => void;
  clear: () => void;
  init: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null, role: null, name: null,
  setAuth: (accessToken, role, name = '') => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('role', role);
    if (name) localStorage.setItem('name', name);
    set({ accessToken, role, name });
  },
  clear: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    set({ accessToken: null, role: null, name: null });
  },
  init: () => {
    const accessToken = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    if (accessToken) set({ accessToken, role, name });
  },
}));
