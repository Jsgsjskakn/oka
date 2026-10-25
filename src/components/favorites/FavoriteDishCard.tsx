'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Plus } from 'lucide-react';
import type { Dish } from '@/types/menu';
import { useFavoritesStore } from '@/store/favorites-store';
import { useCartStore } from '@/store/cart-store';
import { toast } from '@/store/toast-store';

interface FavoriteDishCardProps {
  dish: Dish;
}

export function FavoriteDishCard({ dish }: FavoriteDishCardProps) {
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(dish, 1);
    toast.success('Added to Cart', `${dish.name} (₹${dish.price})`);
  };

  const handleRemoveFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(dish.id);
    toast.info('Removed from Favorites', dish.name);
  };

  return (
    <div className="relative rounded-2xl bg-[#09150d]/85 border border-white/[0.08] hover:border-white/20 transition-all duration-300 hover:-translate-y-1 overflow-hidden group shadow-[0_12px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between">
      <Link
        href={`/menu/${dish.category || 'all'}/${dish.slug}`}
        className="block relative aspect-[4/3] w-full bg-black/40 overflow-hidden"
      >
        <Image
          src={dish.image || '/images/dishes/placeholder.jpg'}
          alt={dish.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        <button
          type="button"
          onClick={handleRemoveFavorite}
          aria-label="Remove from favorites"
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-[#061209]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-rose-400 hover:scale-110 active:scale-95 transition-transform z-10"
        >
          <Heart className="w-4 h-4 fill-rose-400 text-rose-400" />
        </button>
      </Link>

      <div className="p-3.5 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <Link
              href={`/menu/${dish.category || 'all'}/${dish.slug}`}
              className="font-heading text-sm sm:text-base font-bold text-white line-clamp-1 hover:text-[#d4af37] transition-colors"
            >
              {dish.name}
            </Link>
            <div className="flex items-center justify-center w-3.5 h-3.5 rounded-sm bg-white p-[2px] mt-0.5 shrink-0">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  dish.isVeg ? 'bg-green-600' : 'bg-red-600'
                }`}
              />
            </div>
          </div>
          <p className="text-xs text-white/60 line-clamp-2 leading-relaxed mb-3 h-8">
            {dish.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06] mt-auto">
          <span className="text-sm sm:text-base font-extrabold text-[#d4af37]">
            ₹{dish.price}
          </span>
          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Add ${dish.name} to cart`}
            className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38936] text-black font-semibold text-xs hover:scale-105 active:scale-95 transition-transform shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
