import { create } from 'zustand';

interface SpotlightState {
  isOpen: boolean;
  query: string;
  openSpotlight: (initialQuery?: string) => void;
  closeSpotlight: () => void;
  toggleSpotlight: () => void;
  setQuery: (query: string) => void;
}

export const useSpotlightStore = create<SpotlightState>((set) => ({
  isOpen: false,
  query: '',
  openSpotlight: (initialQuery = '') => set({ isOpen: true, query: initialQuery }),
  closeSpotlight: () => set({ isOpen: false }),
  toggleSpotlight: () => set((state) => ({ isOpen: !state.isOpen })),
  setQuery: (query: string) => set({ query }),
}));
