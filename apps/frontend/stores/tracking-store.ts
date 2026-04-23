'use client';

import { create } from 'zustand';

type TrackingState = {
  etaMinutes: number;
  marker: { x: number; y: number };
  setTracking: (payload: { etaMinutes?: number; marker?: { x: number; y: number } }) => void;
};

export const useTrackingStore = create<TrackingState>((set) => ({
  etaMinutes: 28,
  marker: { x: 64, y: 58 },
  setTracking: ({ etaMinutes, marker }) =>
    set((state) => ({
      etaMinutes: etaMinutes ?? state.etaMinutes,
      marker: marker ?? state.marker,
    })),
}));
