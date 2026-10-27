'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Box, Check } from 'lucide-react';
import { DishWithCategory, formatMoney } from '@/lib/db/types';
import { useFavoritesStore } from '@/store/favorites-store';
import { useCartStore } from '@/store/cart-store';
import { useRecentlyViewedStore } from '@/store/recently-viewed-store';
import { toast } from '@/store/toast-store';
import { resolveDishImageUrl } from '@/lib/utils/dish-images';
import { hasModel } from '@/data/model-config';

interface MenuDishCardProps {
  dish: DishWithCategory;
  searchHighlight?: string;
}

export function MenuDishCard({ dish, searchHighlight }: MenuDishCardProps) {
  const router = useRouter();
  const isFav = useFavoritesStore((s) => s.isFavorite(dish.id));
  const toggleFav = useFavoritesStore((s) => s.toggleFavorite);
  const addItem = useCartStore((s) => s.addItem);
  const addRecentDish = useRecentlyViewedStore((s) => s.addRecentDish);
  const [isAdded, setIsAdded] = useState(false);

  const handleCardClick = () => {
    addRecentDish(dish);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(
      {
        id: dish.id,
        slug: dish.slug,
        name: dish.name,
        description: dish.description || '',
        price: dish.price_paise / 100,
        image: resolveDishImageUrl(dish.slug, dish.image_url),
        category: (dish.categories?.slug as any) || 'pizza',
        isVeg: dish.is_veg,
        isAvailable: dish.is_available,
        isFeatured: dish.is_featured,
        isBestSeller: dish.is_best_seller,
        spiceLevel: (dish.spice_level as any) || 'mild',
        has3DModel: dish.has_3d_model,
      },
      1
    );
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1600);
    toast.success('Added to Cart', `${dish.name} (${formatMoney(dish.price_paise)})`);
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFav(dish.id);
    if (!isFav) {
      toast.info('Added to Favorites', dish.name);
    } else {
      toast.info('Removed from Favorites', dish.name);
    }
  };

  const show3D = Boolean(dish.has_3d_model || hasModel(dish.slug));
  const resolvedImage = resolveDishImageUrl(dish.slug, dish.image_url);

  // Single dignified badge
  const badgeText = dish.is_best_seller
    ? 'BEST SELLER'
    : dish.is_featured
    ? "CHEF'S SIGNATURE"
    : 'SIGNATURE CRAFT';
  const badgeColor = dish.is_best_seller
    ? 'text-[#E0532B] border-[#E0532B]/40'
    : 'text-[#E2A84B] border-[#E2A84B]/40';

  const categoryName = dish.categories?.slug === 'pizza'
    ? 'Wood-Fired Sourdough'
    : dish.categories?.slug === 'burger'
    ? 'Artisanal Brioche'
    : dish.categories?.slug === 'chinese'
    ? 'Wok & Oriental'
    : 'Signature Small Plate';

  return (
    <div
      className="group relative flex flex-col justify-between overflow-hidden transition-all duration-500 hover:-translate-y-2.5 w-full rounded-3xl border cursor-pointer"
      style={{
        background: 'rgba(20, 15, 11, 0.45)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        border: '1px solid rgba(240, 195, 107, 0.35)',
        borderTop: '1px solid rgba(255, 235, 185, 0.50)',
        boxShadow:
          'inset 0 1px 1px rgba(255, 255, 255, 0.22), 0 20px 45px rgba(0, 0, 0, 0.70)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(240, 195, 107, 0.70)';
        e.currentTarget.style.borderTopColor = 'rgba(255, 240, 200, 0.85)';
        e.currentTarget.style.boxShadow =
          'inset 0 1px 2px rgba(255, 255, 255, 0.35), 0 30px 65px rgba(0, 0, 0, 0.85), 0 0 28px rgba(240, 195, 107, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(240, 195, 107, 0.35)';
        e.currentTarget.style.borderTopColor = 'rgba(255, 235, 185, 0.50)';
        e.currentTarget.style.boxShadow =
          'inset 0 1px 1px rgba(255, 255, 255, 0.22), 0 20px 45px rgba(0, 0, 0, 0.70)';
      }}
    >
      {/* Top Image Frame with Soft Dark Bottom Fade */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/40">
        <Link
          href={`/3d/${dish.slug}`}
          onClick={handleCardClick}
          className="relative block w-full h-full"
        >
          <Image
            src={resolvedImage}
            alt={dish.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
          />

          {/* Soft dark fade melting photo seamlessly into translucent glass surface */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                'linear-gradient(to top, rgba(20, 15, 11, 0.85) 5%, rgba(20, 15, 11, 0.25) 35%, transparent 65%)',
            }}
          />
        </Link>

        {/* Top-Left: Single Clean Frosted Glass Badge */}
        <div
          className={`absolute top-3 left-3 z-20 px-3 py-1 rounded-full text-[10px] font-serif font-bold tracking-wider flex items-center gap-1 pointer-events-none border ${badgeColor}`}
          style={{
            background: 'rgba(16, 12, 9, 0.55)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 4px 14px rgba(0, 0, 0, 0.4)',
          }}
        >
          <span>{badgeText}</span>
        </div>

        {/* Top-Right: View in AR Button */}
        <Link
          href={`/ar/${dish.slug}`}
          onClick={(e) => e.stopPropagation()}
          title="Place on Table (AR)"
          className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-bold text-[#FAF5EC] hover:text-[#FFE1A0] active:scale-95 transition-all group/ar"
          style={{
            background: 'rgba(16, 12, 9, 0.55)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(240, 195, 107, 0.45)',
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.20), 0 4px 14px rgba(0, 0, 0, 0.4)',
          }}
        >
          <Box className="w-3.5 h-3.5 text-[#F0C36B] group-hover/ar:rotate-45 transition-transform duration-300" />
          <span>VIEW IN AR</span>
        </Link>

        {/* Bottom-Right: Heart Favorite Button */}
        <button
          type="button"
          onClick={handleToggleFav}
          aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
          className="absolute bottom-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-all"
          style={{
            background: 'rgba(16, 12, 9, 0.55)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.20), 0 4px 14px rgba(0, 0, 0, 0.4)',
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
          {/* Dish Category Micro-Overline + Veg/Non-Veg Indicator */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#E2A84B]/80 font-bold">
              {categoryName}
            </span>

            <span
              className={`inline-block w-3.5 h-3.5 border p-[2px] rounded-[3px] shrink-0 ${
                dish.is_veg ? 'border-emerald-600' : 'border-rose-600'
              }`}
              title={dish.is_veg ? 'Pure Vegetarian' : 'Non-Vegetarian'}
            >
              <span
                className={`block w-full h-full rounded-full ${
                  dish.is_veg ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              />
            </span>
          </div>

          {/* Full Dish Title (No Truncation / No Ellipsis) */}
          <Link
            href={`/3d/${dish.slug}`}
            onClick={handleCardClick}
            className="block font-serif text-[20px] sm:text-[22px] font-bold text-[#FAF5EC] leading-snug hover:text-[#E2A84B] transition-colors line-clamp-2 min-h-[52px]"
          >
            {searchHighlight && searchHighlight.trim() ? (
              dish.name.split(new RegExp(`(${searchHighlight.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')).map((part, i) =>
                part.toLowerCase() === searchHighlight.trim().toLowerCase() ? (
                  <mark key={i} className="bg-[rgba(226,168,75,0.32)] text-[#FAF5EC] rounded-sm px-0.5">
                    {part}
                  </mark>
                ) : (
                  part
                )
              )
            ) : (
              dish.name
            )}
          </Link>

          {/* Description (2 lines balanced without horizontal clipping) */}
          <p className="text-[13px] text-[#A6A095] font-light leading-relaxed line-clamp-2 min-h-[42px]">
            {dish.description}
          </p>
        </div>

        {/* Card Footer: Price (Monospace Bold) + View in AR + Tactile ADD + Button */}
        <div className="pt-4 mt-3 flex items-center justify-between border-t border-white/[0.08] gap-2">
          <div className="flex flex-col shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-[#9A9286] font-medium">
              PRICE
            </span>
            <span className="font-mono text-lg sm:text-[19px] font-bold text-[#FAF5EC]">
              {formatMoney(dish.price_paise)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View in AR Button */}
            <Link
              href={`/ar/${dish.slug}`}
              onClick={(e) => e.stopPropagation()}
              title={`View ${dish.name} in AR`}
              className="px-3 py-2 text-xs font-semibold text-[#FFE1A0] hover:text-[#0D0A08] hover:bg-[#F0C36B] rounded-xl border border-[#F0C36B]/40 hover:border-[#F0C36B] transition-all active:scale-95 shadow-sm flex items-center gap-1.5 bg-white/[0.05] backdrop-blur-md group/arbtn cursor-pointer"
            >
              <Box className="w-3.5 h-3.5 text-[#F0C36B] group-hover/arbtn:text-[#0D0A08] transition-colors" />
              <span className="whitespace-nowrap">View in AR</span>
            </Link>

            <button
              type="button"
              onClick={handleAddToCart}
              aria-label={`Add ${dish.name} to dining order`}
              className={`px-4 sm:px-5 py-2 text-xs font-extrabold transition-all duration-300 active:scale-95 shadow-md flex items-center gap-1.5 rounded-xl cursor-pointer ${
                isAdded
                  ? 'bg-[#22C58B] text-[#0D0A08] shadow-[0_0_15px_rgba(34,197,139,0.5)]'
                  : 'text-[#17100C] hover:brightness-110 shadow-lg'
              }`}
              style={{
                background: isAdded
                  ? '#22C58B'
                  : 'linear-gradient(135deg, #F0C36B 0%, #DDA33E 50%, #A8792A 100%)',
              }}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>ADDED</span>
                </>
              ) : (
                <span>ADD +</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
