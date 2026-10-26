'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Plus, Box, Check, Sparkles } from 'lucide-react';
import type { Dish } from '@/types/menu';
import { useFavoritesStore } from '@/store/favorites-store';
import { useCartStore } from '@/store/cart-store';
import { toast } from '@/store/toast-store';
import { resolveDishImageUrl } from '@/lib/utils/dish-images';
import { hasModel } from '@/data/model-config';

interface FavoriteDishCardProps {
  dish: Dish;
}

const DISH_PAIRINGS: Record<string, string> = {
  'tandoori-paneer-pizza': 'Pairs well with: Mint Chutney & Rosemary Truffle Fries',
  'chicken-tikka-pizza': 'Pairs well with: Smoked Garlic Dip & Sparkling Cider',
  'mushroom-truffle-pizza': 'Pairs well with: Chianti Classico & Garlic Sourdough',
  'peri-peri-fiesta-pizza': 'Pairs well with: Chilled Lemon Mint Cooler',
  'bbq-chicken-overload': 'Pairs well with: Aged Cheddar Wedges & Craft Stout',
  'classic-smash-burger': 'Pairs well with: Dynamite Chilli Potatoes & Aioli',
  'golden-oak-signature-burger': 'Pairs well with: Truffle Parmesan Fries & Craft IPA',
  'crispy-chicken-burger': 'Pairs well with: Jalapeño Poppers & House Slaw',
  'wok-tossed-chow-mein': 'Pairs well with: Dynamite Chilli Potatoes',
  'dynamite-chilli-potatoes': 'Pairs well with: Wok-Tossed Schezwan Sauce',
  'golden-chilli-potato': 'Pairs well with: Wok-Tossed Schezwan Sauce',
};

function getDishPairing(slug: string, category?: string): string {
  if (DISH_PAIRINGS[slug]) return DISH_PAIRINGS[slug];
  if (category === 'pizza') return 'Pairs well with: Garlic Sourdough & Herbed Oil';
  if (category === 'burger') return 'Pairs well with: Crispy Truffle Potato Wedges';
  if (category === 'chinese') return 'Pairs well with: Steamed Dim Sums';
  return 'Pairs well with: Sommelier Reserve Pairing';
}

export function FavoriteDishCard({ dish }: FavoriteDishCardProps) {
  const router = useRouter();
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const addItem = useCartStore((s) => s.addItem);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(dish, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1600);
    toast.success('Added to Cart', `${dish.name} (₹${dish.price})`);
  };

  const handleRemoveFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(dish.id);
    toast.info('Removed from Tasting Vault', dish.name);
  };

  const resolvedImage = resolveDishImageUrl(dish.slug, dish.image);
  const pairingNote = getDishPairing(dish.slug, dish.category);
  const canShow3D = Boolean(dish.has3DModel || hasModel(dish.slug));

  const categoryName =
    dish.category === 'pizza'
      ? 'Wood-Fired Sourdough'
      : dish.category === 'burger'
      ? 'Artisanal Brioche'
      : dish.category === 'chinese'
      ? 'Wok & Oriental'
      : 'Signature Small Plate';

  return (
    <div
      className="group relative flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1.5 w-full rounded-2xl border"
      style={{
        background: 'linear-gradient(180deg, #181310 0%, #120E0B 100%)',
        borderTop: '1px solid rgba(246, 211, 134, 0.32)',
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
              background:
                'linear-gradient(to top, #181310 6%, rgba(24, 19, 16, 0.35) 30%, transparent 60%)',
            }}
          />
        </Link>

        {/* Top-Left: Vault Status Badge */}
        <div
          className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-md text-[10px] font-serif font-bold tracking-wider flex items-center gap-1 shadow-lg pointer-events-none border text-[#E2A84B] border-[#E2A84B]/40"
          style={{
            background: 'rgba(13, 10, 8, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <Sparkles className="w-2.5 h-2.5 text-[#E2A84B]" />
          <span>CURATED VAULT</span>
        </div>

        {/* Top-Right: Active Ruby-Gold Heart Badge */}
        <button
          type="button"
          onClick={handleRemoveFavorite}
          aria-label="Remove from vault"
          title="Remove from Tasting Vault"
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center text-[#E0532B] hover:scale-110 active:scale-90 transition-all shadow-xl"
          style={{
            background: 'rgba(13, 10, 8, 0.88)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(226, 168, 75, 0.45)',
          }}
        >
          <Heart className="w-4 h-4 fill-[#E0532B] text-[#E0532B]" />
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

          {/* Dish Title */}
          <Link
            href={`/3d/${dish.slug}`}
            className="block font-serif text-[20px] sm:text-[22px] font-bold text-[#FAF5EC] leading-snug hover:text-[#E2A84B] transition-colors line-clamp-1"
          >
            {dish.name}
          </Link>

          {/* Concierge Pairing Note */}
          <div className="px-2.5 py-1.5 rounded-[5px] bg-[#14100D] border border-[rgba(226,168,75,0.18)] flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#E2A84B] shrink-0" />
            <p className="text-[11px] text-[#C9BFB2] font-light truncate">
              {pairingNote}
            </p>
          </div>

          {/* Description */}
          <p className="text-[12.5px] text-[#A6A095] font-light leading-relaxed line-clamp-2 min-h-[38px]">
            {dish.description}
          </p>
        </div>

        {/* Card Footer: Price + 2-Button Action Bar */}
        <div className="pt-4 mt-3 border-t border-white/[0.08] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#9A9286] font-medium">
              CURATED PRICE
            </span>
            <span className="font-mono text-lg font-bold text-[#FAF5EC]">
              ₹{dish.price}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Move to Bag Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label={`Add ${dish.name} to dining order`}
              className={`py-2 px-3 text-xs font-bold transition-all duration-300 active:scale-95 shadow-md flex items-center justify-center gap-1 rounded-[6px] ${
                isAdded
                  ? 'bg-[#22C58B] text-[#0D0A08]'
                  : 'text-[#0D0A08]'
              }`}
              style={{
                background: isAdded
                  ? '#22C58B'
                  : 'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
              }}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Move to Bag</span>
                </>
              )}
            </button>

            {/* View in AR Button */}
            <Link
              href={`/ar/${dish.slug}`}
              className="py-2 px-3 rounded-[6px] bg-white/[0.05] hover:bg-white/[0.1] border border-[rgba(226,168,75,0.3)] text-xs font-semibold text-[#FAF5EC] hover:text-[#E2A84B] flex items-center justify-center gap-1.5 transition-all active:scale-95 text-center"
            >
              <Box className="w-3.5 h-3.5 text-[#E2A84B]" />
              <span>View in AR</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
