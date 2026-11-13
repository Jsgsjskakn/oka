import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesStore {
  favoriteIds: string[];
  toggleFavorite: (dishId: string) => void;
  toggleDishFavorite: (primaryId: string, aliases?: string[]) => boolean;
  isFavorite: (dishId: string) => boolean;
  isDishFavorite: (ids: (string | undefined | null)[]) => boolean;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      toggleFavorite: (dishId: string) => {
        const current = get().favoriteIds;
        if (current.includes(dishId)) {
          set({ favoriteIds: current.filter((id) => id !== dishId) });
        } else {
          set({ favoriteIds: [...current, dishId] });
        }
      },
      toggleDishFavorite: (primaryId: string, aliases: string[] = []) => {
        const keys = Array.from(new Set([primaryId, ...aliases].filter(Boolean)));
        const current = get().favoriteIds;
        const alreadySaved = keys.some((k) => current.includes(k));
        if (alreadySaved) {
          set({ favoriteIds: current.filter((id) => !keys.includes(id)) });
          return false;
        }
        set({ favoriteIds: [...current, primaryId] });
        return true;
      },
      isFavorite: (dishId: string) => get().favoriteIds.includes(dishId),
      isDishFavorite: (ids: (string | undefined | null)[]) => {
        const current = get().favoriteIds;
        return ids.some((id) => Boolean(id && current.includes(id)));
      },
      clearFavorites: () => set({ favoriteIds: [] }),
    }),
    { name: 'golden-oak-favorites' }
  )
);
