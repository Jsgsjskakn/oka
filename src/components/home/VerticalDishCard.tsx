'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Box } from 'lucide-react';
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

  const rankTag = rank ? `#0${rank} SIGNATURE` : '#01 SIGNATURE';
  const resolvedImage = resolveDishImageUrl(dish.slug, dish.image);

  return (
    <div
      className="group relative flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1 w-full"
      style={{
        background: '#15110E',
        borderRadius: '10px',
        borderTop: '1px solid rgba(246, 211, 134, 0.28)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
      }}
    >
      {/* Top Image Frame with Soft Dark Bottom Fade */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/60">
        <Link
          href={`/menu/${dish.category || 'all'}/${dish.slug}`}
          className="relative block w-full h-full"
        >
          <Image
            src={resolvedImage}
            alt={dish.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />

          {/* Soft dark fade melting photo into card surface */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background: 'linear-gradient(to top, #15110E 4%, transparent 35%)',
            }}
          />
        </Link>

        {/* Top-Left Sleek Dark Glass Tag (#01 SIGNATURE) */}
        <div
          className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-md text-[10px] font-serif font-bold tracking-wider text-[#E2A84B] flex items-center gap-1 shadow-md"
          style={{
            background: 'rgba(13, 10, 8, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(226, 168, 75, 0.3)',
          }}
        >
          {rankTag}
        </div>

        {/* Top-Right 3D Trigger Button: Sleek glass pill 3D VIEW */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/3d/${dish.slug}`);
          }}
          title="Interactive 3D View"
          className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-semibold text-[#FAF5EC] hover:text-[#E0532B] hover:border-[#E0532B]/50 transition-all shadow-md group/threed"
          style={{
            background: 'rgba(13, 10, 8, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(226, 168, 75, 0.3)',
          }}
        >
          <Box className="w-3 h-3 text-[#E2A84B] group-hover/threed:text-[#E0532B] transition-colors" />
          <span>3D VIEW</span>
        </button>

        {/* Bottom-Right Heart Button */}
        <button
          type="button"
          onClick={handleToggleFav}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute bottom-3 right-3 z-20 w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all shadow-md"
          style={{
            background: 'rgba(13, 10, 8, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors ${
              isFav ? 'text-rose-500 fill-rose-500' : 'text-[#FAF5EC]'
            }`}
          />
        </button>
      </div>

      {/* Card Body Typography */}
      <div className="p-5 flex flex-col justify-between flex-1">
        <div className="space-y-2">
          {/* Dish Title + Subtle 12px Veg/Non-Veg indicator */}
          <div className="flex items-baseline gap-2">
            <span
              className={`inline-block w-3 h-3 border p-[2px] rounded-[2px] shrink-0 translate-y-0.5 ${
                dish.isVeg ? 'border-emerald-600' : 'border-rose-600'
              }`}
            >
              <span
                className={`block w-full h-full rounded-full ${
                  dish.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              />
            </span>
            <Link
              href={`/menu/${dish.category || 'all'}/${dish.slug}`}
              className="font-serif text-[21px] font-semibold text-[#FAF5EC] leading-snug hover:text-[#E2A84B] transition-colors line-clamp-1"
            >
              {dish.name}
            </Link>
          </div>

          {/* Description (2 lines full, line-clamp-2) */}
          <p className="text-[13px] text-[#9A9286] leading-relaxed line-clamp-2 min-h-[38px]">
            {dish.description}
          </p>
        </div>

        {/* Card Footer: Price (Ivory White Monospace) + ADD + Button */}
        <div className="pt-4 mt-3 flex items-center justify-between border-t border-white/[0.06]">
          <span className="font-mono text-[17px] font-bold text-[#FAF5EC]">
            ₹{dish.price}
          </span>

          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Add ${dish.name} to dining order`}
            className="px-4 py-2 text-xs font-bold transition-all duration-200 active:scale-95 shadow-sm"
            style={{
              borderRadius: '6px',
              background: 'rgba(226, 168, 75, 0.12)',
              border: '1px solid rgba(226, 168, 75, 0.35)',
              color: '#E2A84B',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E2A84B';
              e.currentTarget.style.color = '#0D0A08';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(226, 168, 75, 0.12)';
              e.currentTarget.style.color = '#E2A84B';
            }}
          >
            ADD +
          </button>
        </div>
      </div>
    </div>
  );
}
