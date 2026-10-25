import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesStore {
  favoriteIds: string[];
  toggleFavorite: (dishId: string) => void;
  isFavorite: (dishId: string) => boolean;
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
      isFavorite: (dishId: string) => get().favoriteIds.includes(dishId),
      clearFavorites: () => set({ favoriteIds: [] }),
    }),
    { name: 'golden-oak-favorites' }
  )
);
