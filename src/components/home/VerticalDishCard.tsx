'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Box, Check } from 'lucide-react';
import type { Dish } from '@/types/menu';
import { useCartStore } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';
import { toast } from '@/store/toast-store';
import { resolveDishImageUrl } from '@/lib/utils/dish-images';

interface VerticalDishCardProps {
  dish: Dish;
  onAdd?: (dish: Dish) => void;
  rank?: number;
}

export function VerticalDishCard({ dish, onAdd, rank }: VerticalDishCardProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const isFav = useFavoritesStore((s) => s.isFavorite(dish.id));
  const toggleFav = useFavoritesStore((s) => s.toggleFavorite);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAdd) {
      onAdd(dish);
    } else {
      addItem(dish, 1);
    }
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1600);
    toast.success('Added to Cart', `${dish.name} (₹${dish.price})`);
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFav(dish.id);
  };

  const rankTag = rank ? `#0${rank} SIGNATURE` : '#01 SIGNATURE';
  const resolvedImage = resolveDishImageUrl(dish.slug, dish.image);

  return (
    <div
      className="group relative flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-2 w-full rounded-2xl border"
      style={{
        background: 'linear-gradient(180deg, #181310 0%, #120E0B 100%)',
        borderTop: '1px solid rgba(246, 211, 134, 0.35)',
        borderLeft: '1px solid rgba(226, 168, 75, 0.15)',
        borderRight: '1px solid rgba(226, 168, 75, 0.15)',
        borderBottom: '1px solid rgba(226, 168, 75, 0.15)',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.75)',
      }}
    >
      {/* Top Image Frame with Soft Dark Bottom Fade */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/70">
        <Link
          href={`/3d/${dish.slug}`}
          className="relative block w-full h-full"
        >
          <Image
            src={resolvedImage}
            alt={dish.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
          />

          {/* Soft dark fade melting photo seamlessly into card surface */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background: 'linear-gradient(to top, #181310 6%, rgba(24, 19, 16, 0.4) 30%, transparent 60%)',
            }}
          />
        </Link>

        {/* Top-Left Sleek Dark Glass Tag (#01 SIGNATURE) */}
        <div
          className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-md text-[10px] font-serif font-bold tracking-wider text-[#E2A84B] flex items-center gap-1 shadow-lg pointer-events-none"
          style={{
            background: 'rgba(13, 10, 8, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(226, 168, 75, 0.35)',
          }}
        >
          {rankTag}
        </div>

        {/* Top-Right View in AR Button: Sleek Glass Pill VIEW IN AR */}
        <Link
          href={`/ar/${dish.slug}`}
          onClick={(e) => e.stopPropagation()}
          title="Place on Table (AR)"
          className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-bold text-[#FAF5EC] hover:text-[#E2A84B] hover:border-[#E2A84B] active:scale-95 transition-all shadow-lg group/ar"
          style={{
            background: 'rgba(13, 10, 8, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(226, 168, 75, 0.35)',
          }}
        >
          <Box className="w-3.5 h-3.5 text-[#E2A84B] group-hover/ar:rotate-45 transition-transform duration-300" />
          <span>VIEW IN AR</span>
        </Link>

        {/* Bottom-Right Heart Favorite Button */}
        <button
          type="button"
          onClick={handleToggleFav}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute bottom-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-all shadow-xl"
          style={{
            background: 'rgba(13, 10, 8, 0.82)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
          }}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFav ? 'text-rose-500 fill-rose-500 scale-110' : 'text-[#FAF5EC]'
            }`}
          />
        </button>
      </div>

      {/* Card Body Typography */}
      <div className="p-5 flex flex-col justify-between flex-1">
        <div className="space-y-2.5">
          {/* Dish Category Micro-Overline */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#E2A84B]/80 font-bold">
              {dish.category === 'pizza'
                ? 'Wood-Fired Sourdough'
                : dish.category === 'burger'
                ? 'Artisanal Brioche'
                : dish.category === 'chinese'
                ? 'Wok & Oriental'
                : 'Signature Small Plate'}
            </span>

            {/* Subtle Veg / Non-Veg Indicator */}
            <span
              className={`inline-block w-3.5 h-3.5 border p-[2px] rounded-[3px] shrink-0 ${
                dish.isVeg ? 'border-emerald-600' : 'border-rose-600'
              }`}
              title={dish.isVeg ? 'Pure Vegetarian' : 'Non-Vegetarian'}
            >
              <span
                className={`block w-full h-full rounded-full ${
                  dish.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              />
            </span>
          </div>

          {/* Full Dish Title (No Truncation / No Ellipsis) */}
          <Link
            href={`/3d/${dish.slug}`}
            className="block font-serif text-[20px] sm:text-[22px] font-bold text-[#FAF5EC] leading-snug hover:text-[#E2A84B] transition-colors line-clamp-2 min-h-[54px]"
          >
            {dish.name}
          </Link>

          {/* Description (2 lines balanced) */}
          <p className="text-[13px] text-[#A6A095] font-light leading-relaxed line-clamp-2 min-h-[40px]">
            {dish.description}
          </p>
        </div>

        {/* Card Footer: Price (Monospace Bold) + Tactile ADD + Button */}
        <div className="pt-4 mt-3 flex items-center justify-between border-t border-white/[0.08]">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-[#9A9286] font-medium">
              PRICE
            </span>
            <span className="font-mono text-lg sm:text-[19px] font-bold text-[#FAF5EC]">
              ₹{dish.price}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Add ${dish.name} to order`}
            className={`px-5 py-2.5 text-xs font-extrabold transition-all duration-300 active:scale-95 shadow-md flex items-center gap-1.5 rounded-[6px] ${
              isAdded
                ? 'bg-[#22C58B] text-[#0D0A08] shadow-[0_0_15px_rgba(34,197,139,0.5)]'
                : 'text-[#E2A84B] hover:text-[#0D0A08]'
            }`}
            style={{
              background: isAdded
                ? '#22C58B'
                : 'linear-gradient(135deg, rgba(226, 168, 75, 0.14) 0%, rgba(226, 168, 75, 0.06) 100%)',
              border: isAdded
                ? '1px solid #22C58B'
                : '1px solid rgba(226, 168, 75, 0.45)',
            }}
            onMouseEnter={(e) => {
              if (!isAdded) {
                e.currentTarget.style.background =
                  'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)';
                e.currentTarget.style.color = '#0D0A08';
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}
            onMouseLeave={(e) => {
              if (!isAdded) {
                e.currentTarget.style.background =
                  'linear-gradient(135deg, rgba(226, 168, 75, 0.14) 0%, rgba(226, 168, 75, 0.06) 100%)';
                e.currentTarget.style.color = '#E2A84B';
                e.currentTarget.style.borderColor = 'rgba(226, 168, 75, 0.45)';
              }
            }}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>ADDED ✓</span>
              </>
            ) : (
              <span>ADD +</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
