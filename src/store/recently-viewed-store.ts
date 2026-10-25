'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DishWithCategory } from '@/lib/db/types';

interface RecentlyViewedStore {
  recentDishes: DishWithCategory[];
  addRecentDish: (dish: DishWithCategory) => void;
  clearRecentDishes: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      recentDishes: [],
      addRecentDish: (dish) => {
        const existing = get().recentDishes;
        const filtered = existing.filter((d) => d.id !== dish.id);
        // Prepend and keep max 8
        set({ recentDishes: [dish, ...filtered].slice(0, 8) });
      },
      clearRecentDishes: () => set({ recentDishes: [] }),
    }),
    { name: 'golden-oak-recently-viewed' }
  )
);
