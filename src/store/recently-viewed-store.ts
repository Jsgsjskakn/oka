'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DishWithCategory } from '@/lib/db/types';

export type ExploredDishSource =
  | '3d_viewer'
  | 'order_history'
  | 'account_vault'
  | 'menu'
  | 'curated';

export interface ExploredDishItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price_paise: number;
  image_url?: string | null;
  category?: string;
  is_veg?: boolean;
  is_available?: boolean;
  is_featured?: boolean;
  is_best_seller?: boolean;
  spice_level?: string | null;
  ingredients?: string[];
  source?: ExploredDishSource;
  exploredAt?: string;
  categories?: any;
}

export interface CustomerAccountSummary {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  isAuthenticated?: boolean;
}

interface RecentlyViewedStore {
  recentDishes: ExploredDishItem[];
  accountHistoryDishes: ExploredDishItem[];
  lastExploredDish: ExploredDishItem | null;
  customerAccount: CustomerAccountSummary | null;
  addRecentDish: (dish: any, source?: ExploredDishSource) => void;
  setAccountHistoryDishes: (dishes: ExploredDishItem[]) => void;
  setCustomerAccount: (account: CustomerAccountSummary | null) => void;
  clearRecentDishes: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      recentDishes: [],
      accountHistoryDishes: [],
      lastExploredDish: null,
      customerAccount: null,
      addRecentDish: (dish, source = '3d_viewer') => {
        const item: ExploredDishItem = {
          id: dish.id,
          name: dish.name,
          slug: dish.slug,
          description: dish.description || null,
          price_paise: dish.price_paise,
          image_url: dish.image_url || null,
          category: (dish as any).category || (dish as any).categories?.slug || 'pizza',
          is_veg: dish.is_veg ?? true,
          is_available: dish.is_available ?? true,
          is_featured: dish.is_featured ?? false,
          is_best_seller: dish.is_best_seller ?? false,
          spice_level: dish.spice_level || 'medium',
          ingredients: (dish as any).ingredients || [],
          source,
          exploredAt: new Date().toISOString(),
        };
        const existing = get().recentDishes;
        const filtered = existing.filter((d) => d.id !== item.id && d.slug !== item.slug);
        const updated = [item, ...filtered].slice(0, 8);
        set({
          recentDishes: updated,
          lastExploredDish: item,
        });
      },
      setAccountHistoryDishes: (dishes) => {
        const currentRecent = get().recentDishes;
        set({
          accountHistoryDishes: dishes,
          lastExploredDish:
            currentRecent.length > 0 ? currentRecent[0] : dishes.length > 0 ? dishes[0] : null,
        });
      },
      setCustomerAccount: (account) => {
        set({ customerAccount: account });
      },
      clearRecentDishes: () => set({ recentDishes: [], lastExploredDish: null }),
    }),
    { name: 'golden-oak-recently-viewed' }
  )
);
