'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, Heart, Sparkles, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFavoritesStore } from '@/store/favorites-store';
import { FavoriteDishCard } from '@/components/favorites/FavoriteDishCard';
import { EmptyState } from '@/components/shared/EmptyState';
import type { Dish } from '@/types/menu';

export function FavoritesClient({ allDishes }: { allDishes: Dish[] }) {
  const router = useRouter();
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-[70vh] bg-[#060e08] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const favoriteDishes = allDishes.filter((dish) => favoriteIds.includes(dish.id));

  return (
    <div className="min-h-screen bg-[#060e08] text-white pb-24">
      {/* Page Header */}
      <div className="border-b border-white/[0.08] bg-[#061209]/85 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-heading text-lg sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>My Saved Favorites</span>
                <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
              </h1>
              <p className="text-xs text-white/50 hidden sm:block">
                Your personally curated collection of signature dishes
              </p>
            </div>
          </div>

          {favoriteDishes.length > 0 && (
            <span className="px-3 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/30 text-xs font-semibold text-[#d4af37]">
              {favoriteDishes.length} {favoriteDishes.length === 1 ? 'Dish' : 'Dishes'}
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {favoriteDishes.length === 0 ? (
          <div className="text-center py-16 px-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#0d2215]/80 border border-[#d4af37]/30 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#d4af37]/10">
              <Heart className="w-7 h-7 text-[#d4af37]" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-white mb-2">
              No Favorites Saved Yet
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mb-6 leading-relaxed">
              Explore our culinary menu and tap the heart icon on any dish to save it here for fast one-click ordering.
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b38936] text-black font-bold text-xs sm:text-sm shadow-md shadow-[#d4af37]/20 hover:scale-105 active:scale-95 transition-all"
            >
              <UtensilsCrossed className="w-4 h-4 text-black" />
              <span>Explore Menu</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {favoriteDishes.map((dish) => (
              <FavoriteDishCard key={dish.id} dish={dish} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
