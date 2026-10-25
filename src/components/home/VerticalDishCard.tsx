'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus, Heart } from 'lucide-react';
import type { Dish } from '@/types/menu';
import { useCartStore } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';
import { toast } from '@/store/toast-store';

interface VerticalDishCardProps {
  dish: Dish;
  onAdd?: (dish: Dish) => void;
  rank?: number;
}

export function VerticalDishCard({ dish, onAdd, rank }: VerticalDishCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const isFav = useFavoritesStore((s) => s.isFavorite(dish.id));
  const toggleFav = useFavoritesStore((s) => s.toggleFavorite);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAdd) {
      onAdd(dish);
    } else {
      addItem(dish, 1);
    }
    toast.success('Added to Cart', `${dish.name} (₹${dish.price})`);
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFav(dish.id);
  };

  return (
    <div className="flex-none w-[190px] sm:w-[210px] rounded-2xl bg-[#09150d]/85 border border-white/[0.08] hover:border-white/20 overflow-hidden group transition-all duration-300 hover:-translate-y-1 relative shadow-[0_10px_28px_rgba(0,0,0,0.5)]">
      {rank && (
        <div className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8a6828] flex items-center justify-center text-black font-extrabold z-10 text-xs shadow-md">
          {rank}
        </div>
      )}

      <Link
        href={`/menu/${dish.category || 'all'}/${dish.slug}`}
        className="relative aspect-square w-full block bg-black/40 overflow-hidden"
      >
        <Image
          src={dish.image || '/images/dishes/placeholder.jpg'}
          alt={dish.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        <button
          type="button"
          onClick={handleToggleFav}
          className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-[#061209]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-transform"
          aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
        >
          <Heart className={`w-3 h-3 ${isFav ? 'text-rose-400 fill-rose-400' : ''}`} />
        </button>
      </Link>

      <div className="p-3 flex flex-col justify-between h-[115px]">
        <div>
          <div className="flex items-start justify-between gap-1 mb-1">
            <Link
              href={`/menu/${dish.category || 'all'}/${dish.slug}`}
              className="font-heading text-xs sm:text-sm font-bold text-white line-clamp-1 leading-tight flex-1 hover:text-[#d4af37] transition-colors"
            >
              {dish.name}
            </Link>
            <div className="flex items-center justify-center w-3 h-3 rounded-[2px] bg-white p-[2px] mt-0.5 shrink-0">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  dish.isVeg ? 'bg-green-600' : 'bg-red-600'
                }`}
              />
            </div>
          </div>
          <p className="text-[11px] text-white/50 line-clamp-1">
            {dish.description}
          </p>
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between border-t border-white/[0.06]">
          <span className="text-xs sm:text-sm font-bold text-[#d4af37]">
            ₹{dish.price}
          </span>
          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Add ${dish.name} to cart`}
            className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#d4af37] to-[#b38936] text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-sm"
          >
            <Plus className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}
