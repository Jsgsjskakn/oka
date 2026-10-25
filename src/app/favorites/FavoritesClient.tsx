'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFavoritesStore } from '@/store/favorites-store';
import { FavoriteDishCard } from '@/components/favorites/FavoriteDishCard';
import { EmptyState } from '@/components/shared/EmptyState';
import type { Dish } from '@/types/menu';

export function FavoritesClient({ allDishes }: { allDishes: Dish[] }) {
  const router = useRouter();
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const favoriteDishes = allDishes.filter((dish) => favoriteIds.includes(dish.id));

  return (
    <div className="min-h-screen bg-obsidian text-text-primary pb-24">
      <div className="px-4 py-5 flex items-center gap-3 border-b border-white/5 sticky top-0 bg-obsidian z-40">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center -ml-2 text-text-primary/70 hover:text-text-primary active:scale-95">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-heading text-lg font-bold">Favorites</h1>
        {favoriteDishes.length > 0 && (
          <span className="ml-auto text-xs text-text-primary/40">{favoriteDishes.length} saved</span>
        )}
      </div>

      {favoriteDishes.length === 0 ? (
        <EmptyState
          icon={<Heart className="w-7 h-7 text-text-primary/30" />}
          title="No Favorites Yet"
          description="Tap the heart icon on any dish to save it here for quick access."
          actionLabel="Explore Menu"
          actionHref="/menu"
        />
      ) : (
        <div className="px-4 py-4 grid grid-cols-2 gap-3">
          {favoriteDishes.map((dish) => (
            <FavoriteDishCard key={dish.id} dish={dish} />
          ))}
        </div>
      )}
    </div>
  );
}
