'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus, Sparkles, Heart, Box } from 'lucide-react';
import type { Dish } from '@/types/menu';
import { useCartStore } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';
import { toast } from '@/store/toast-store';
import { hasModel } from '@/data/model-config';

interface DishCardProps {
  dish: Dish;
  onAdd?: (dish: Dish) => void;
}

export function DishCard({ dish, onAdd }: DishCardProps) {
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

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFav(dish.id);
    if (!isFav) {
      toast.info('Added to Favorites', dish.name);
    } else {
      toast.info('Removed from Favorites', dish.name);
    }
  };

  const show3D = Boolean(dish.has3DModel || hasModel(dish.slug));

  return (
    <div className="flex-none w-[280px] sm:w-[300px] rounded-2xl bg-[#09150d]/85 border border-white/[0.08] hover:border-white/20 overflow-hidden group transition-all duration-300 hover:-translate-y-1 shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
      <Link
        href={`/3d/${dish.slug}`}
        className="relative aspect-[4/3] w-full block bg-black/40 overflow-hidden"
      >
        <Image
          src={dish.image || '/images/dishes/placeholder.jpg'}
          alt={dish.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges on Top-Left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {dish.isFeatured && (
            <span className="px-2 py-0.5 bg-[#061209]/85 backdrop-blur-md rounded-lg text-[10px] font-semibold text-[#d4af37] border border-[#d4af37]/40 tracking-wider">
              Featured
            </span>
          )}
          {dish.isBestSeller && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-red-600 to-amber-600 rounded-lg text-[10px] font-bold text-white shadow-md tracking-wider">
              Best Seller
            </span>
          )}
        </div>

        {/* Top-Right: AR Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = `/ar/${dish.slug}`;
          }}
          className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[#0D0A08]/90 border border-[#d4af37]/40 flex items-center gap-1 text-[10px] font-bold text-[#d4af37] shadow-lg hover:scale-105 active:scale-95 transition-transform z-10"
          title="View in AR"
        >
          <Box className="w-3 h-3 text-[#d4af37]" />
          <span>AR</span>
        </button>

        {/* Bottom-Right: Heart Button */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-[#061209]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:scale-110 active:scale-95 transition-transform z-10"
          aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFav ? 'text-rose-400 fill-rose-400' : ''}`} />
        </button>
      </Link>

      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <Link
              href={`/3d/${dish.slug}`}
              className="font-heading text-base font-bold text-white line-clamp-1 hover:text-[#d4af37] transition-colors"
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

          <p className="text-xs text-white/60 line-clamp-2 leading-relaxed mb-4 h-9">
            {dish.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <span className="text-base font-extrabold text-[#d4af37]">
            ₹{dish.price}
          </span>
          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Add ${dish.name} to cart`}
            className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38936] text-black font-semibold text-xs hover:scale-105 active:scale-95 transition-transform shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
