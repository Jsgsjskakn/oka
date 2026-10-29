'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Box, Check, Eye, Plus, Minus, Trash2 } from 'lucide-react';
import type { Dish } from '@/types/menu';
import { useCartStore } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';
import { useRecentlyViewedStore } from '@/store/recently-viewed-store';
import { toast } from '@/store/toast-store';
import { resolveDishImageUrl } from '@/lib/utils/dish-images';

interface VerticalDishCardProps {
  dish: Dish;
  onAdd?: (dish: Dish) => void;
  onQuickView?: (dish: Dish) => void;
  rank?: number;
}

export function VerticalDishCard({ dish, onAdd, onQuickView, rank }: VerticalDishCardProps) {
  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const isFav = useFavoritesStore((s) => s.isFavorite(dish.id));
  const toggleFav = useFavoritesStore((s) => s.toggleFavorite);
  const addRecentDish = useRecentlyViewedStore((s) => s.addRecentDish);
  const [isMounted, setIsMounted] = useState(false);

  const recordExplore = () => {
    addRecentDish(
      {
        id: dish.id,
        slug: dish.slug,
        name: dish.name,
        description: dish.description,
        price_paise: Math.round(dish.price * 100),
        image_url: dish.image,
        category: dish.category,
        is_veg: dish.isVeg,
        is_available: dish.isAvailable,
        is_featured: dish.isFeatured,
        is_best_seller: dish.isBestSeller,
        spice_level: dish.spiceLevel,
        has_3d_model: dish.has3DModel,
      },
      '3d_viewer'
    );
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const matchingItems = isMounted
    ? cartItems.filter((i) => i.dish.id === dish.id || i.dish.slug === dish.slug)
    : [];
  const cartQuantity = matchingItems.reduce((acc, curr) => acc + curr.quantity, 0);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAdd) {
      onAdd(dish);
    } else {
      addItem(dish, 1);
    }
    toast.success('Added to Bag', `${dish.name} (₹${dish.price})`);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(12);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const targetItem = matchingItems.find((i) => i.cartItemId === dish.id) || matchingItems[0];
    if (targetItem) {
      updateQuantity(targetItem.cartItemId, targetItem.quantity + 1);
      toast.success('Added More to Bag', `${dish.name} (×${cartQuantity + 1})`);
    } else {
      addItem(dish, 1);
      toast.success('Added More to Bag', `${dish.name} (×${cartQuantity + 1})`);
    }
    if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const targetItem = matchingItems.find((i) => i.cartItemId === dish.id) || matchingItems[matchingItems.length - 1];
    if (!targetItem) return;

    if (targetItem.quantity > 1) {
      updateQuantity(targetItem.cartItemId, targetItem.quantity - 1);
      toast.info('Updated Bag', `${dish.name} (×${cartQuantity - 1})`);
    } else {
      removeItem(targetItem.cartItemId);
      toast.info('Removed from Bag', dish.name);
    }
    if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10);
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFav(dish.id);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(8);
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(dish);
  };

  const rankTag = rank ? `#0${rank} SIGNATURE` : '#01 SIGNATURE';
  const resolvedImage = resolveDishImageUrl(dish.slug, dish.image);

  return (
    <div
      className="group relative flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-2 w-full rounded-2xl border"
      style={{
        background: 'linear-gradient(180deg, #1A130E 0%, #120D09 100%)',
        borderTop: '1px solid rgba(240, 195, 107, 0.35)',
        borderLeft: '1px solid rgba(240, 195, 107, 0.16)',
        borderRight: '1px solid rgba(240, 195, 107, 0.16)',
        borderBottom: '1px solid rgba(240, 195, 107, 0.16)',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.75)',
      }}
    >
      {/* Top Image Frame with Soft Dark Bottom Fade */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/70">
        <Link
          href={`/3d/${dish.slug}`}
          onClick={recordExplore}
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
              background: 'linear-gradient(to top, #1A130E 6%, rgba(26, 19, 14, 0.4) 30%, transparent 60%)',
            }}
          />
        </Link>

        {/* Top-Left Sleek Dark Glass Tag (#01 SIGNATURE) */}
        <div
          className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider text-[#F0C36B] flex items-center gap-1 shadow-lg pointer-events-none"
          style={{
            background: 'rgba(16, 12, 9, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(240, 195, 107, 0.35)',
          }}
        >
          {rankTag}
        </div>

        {/* Top-Right Action Cluster: VIEW IN AR + Quick View Eye */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          {/* Quick View Button */}
          {onQuickView && (
            <button
              type="button"
              onClick={handleQuickViewClick}
              title="Quick view dish details"
              aria-label={`Quick view ${dish.name}`}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#F8F2E8] hover:text-[#F0C36B] hover:border-[#F0C36B] active:scale-90 transition-all shadow-lg cursor-pointer"
              style={{
                background: 'rgba(16, 12, 9, 0.85)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(240, 195, 107, 0.30)',
              }}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}

          {/* View in AR Pill */}
          <Link
            href={`/ar/${dish.slug}`}
            onClick={(e) => e.stopPropagation()}
            title="Place on Table (AR)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-[#F8F2E8] hover:text-[#F0C36B] hover:border-[#F0C36B] active:scale-95 transition-all shadow-lg group/ar"
            style={{
              background: 'rgba(16, 12, 9, 0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(240, 195, 107, 0.30)',
            }}
          >
            <Box className="w-3 h-3 text-[#F0C36B] group-hover/ar:rotate-45 transition-transform duration-300" />
            <span className="hidden sm:inline">VIEW IN AR</span>
          </Link>
        </div>

        {/* Bottom-Right Heart Favorite Button */}
        <button
          type="button"
          onClick={handleToggleFav}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute bottom-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-all shadow-xl cursor-pointer"
          style={{
            background: 'rgba(16, 12, 9, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
          }}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFav ? 'text-rose-500 fill-rose-500 scale-110' : 'text-[#F8F2E8]'
            }`}
          />
        </button>
      </div>

      {/* Card Body Typography */}
      <div className="p-5 flex flex-col justify-between flex-1">
        <div className="space-y-2.5">
          {/* Dish Category Micro-Overline */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#F0C36B] font-bold">
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

          {/* Full Dish Title */}
          <Link
            href={`/3d/${dish.slug}`}
            onClick={recordExplore}
            className="block font-serif text-[20px] sm:text-[22px] font-bold text-[#F8F2E8] leading-snug hover:text-[#F0C36B] transition-colors line-clamp-2 min-h-[54px]"
          >
            {dish.name}
          </Link>

          {/* Description */}
          <p className="text-[13px] text-[#D1C3B1] font-light leading-relaxed line-clamp-2 min-h-[40px]">
            {dish.description}
          </p>
        </div>

        {/* Card Footer: Price + View in AR + Tactile ADD Button */}
        <div className="pt-4 mt-3 flex items-center justify-between border-t border-white/[0.08] gap-2">
          <div className="flex flex-col shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-[#A59685] font-medium">
              PRICE
            </span>
            <span className="font-mono text-lg sm:text-[19px] font-bold text-[#F8F2E8]">
              ₹{dish.price}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View in AR Button */}
            <Link
              href={`/ar/${dish.slug}`}
              onClick={(e) => e.stopPropagation()}
              title={`View ${dish.name} in AR`}
              className="px-3 py-2 text-xs font-semibold text-[#F0C36B] hover:text-[#17100C] hover:bg-[#F0C36B] rounded-[8px] border border-[#F0C36B]/40 hover:border-[#F0C36B] transition-all active:scale-95 shadow-sm flex items-center gap-1.5 bg-black/40 group/arbtn cursor-pointer"
            >
              <Box className="w-3.5 h-3.5 text-[#F0C36B] group-hover/arbtn:text-[#17100C] transition-colors" />
              <span className="whitespace-nowrap">View in AR</span>
            </Link>

            {cartQuantity === 0 ? (
              <button
                type="button"
                onClick={handleAddToCart}
                aria-label={`Add ${dish.name} to order`}
                className="px-4 sm:px-5 py-2.5 text-xs font-extrabold transition-all duration-300 active:scale-95 shadow-md flex items-center gap-1.5 rounded-[8px] cursor-pointer text-[#F0C36B] hover:text-[#17100C]"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(240, 195, 107, 0.16) 0%, rgba(240, 195, 107, 0.06) 100%)',
                  border: '1px solid rgba(240, 195, 107, 0.45)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, #F0C36B 0%, #DDA33E 50%, #A8792A 100%)';
                  e.currentTarget.style.color = '#17100C';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, rgba(240, 195, 107, 0.16) 0%, rgba(240, 195, 107, 0.06) 100%)';
                  e.currentTarget.style.color = '#F0C36B';
                  e.currentTarget.style.borderColor = 'rgba(240, 195, 107, 0.45)';
                }}
              >
                <span>ADD +</span>
              </button>
            ) : (
              <div
                className="flex items-center rounded-[8px] overflow-hidden border shadow-lg backdrop-blur-md transition-all duration-300 h-[38px]"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(240, 195, 107, 0.22) 0%, rgba(221, 163, 62, 0.12) 100%)',
                  borderColor: 'rgba(240, 195, 107, 0.65)',
                  boxShadow:
                    '0 0 16px rgba(240, 195, 107, 0.22), inset 0 1px 1px rgba(255, 240, 200, 0.35)',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {/* Decrement / Remove Button */}
                <button
                  type="button"
                  onClick={handleDecrement}
                  aria-label={`Decrease ${dish.name} quantity`}
                  title={cartQuantity === 1 ? 'Remove from order' : 'Decrease quantity'}
                  className="w-8 h-full flex items-center justify-center text-[#F0C36B] hover:text-[#17100C] hover:bg-[#F0C36B] active:scale-90 transition-all cursor-pointer group/dec"
                >
                  {cartQuantity === 1 ? (
                    <Trash2 className="w-3.5 h-3.5 text-rose-400 group-hover/dec:text-[#17100C] transition-colors" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                </button>

                {/* Display Current Added Quantity (Kitna Add Hua) */}
                <div
                  className="flex items-center justify-center gap-1 px-2.5 font-mono select-none border-x border-[#F0C36B]/30 h-full bg-black/30"
                  title={`${cartQuantity} in your order`}
                >
                  <span className="text-xs font-black text-[#FAF5EC]">
                    {cartQuantity}
                  </span>
                  <span className="text-[10px] font-bold text-[#F0C36B] uppercase tracking-wider hidden sm:inline">
                    in bag
                  </span>
                </div>

                {/* Increment / Add More Button (Add More Option) */}
                <button
                  type="button"
                  onClick={handleIncrement}
                  aria-label={`Add more ${dish.name} to order`}
                  title="Add more"
                  className="w-8 h-full flex items-center justify-center text-[#F0C36B] hover:text-[#17100C] hover:bg-[#F0C36B] active:scale-90 transition-all cursor-pointer group/inc"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
