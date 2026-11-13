'use client';

import React from 'react';
import { UtensilsCrossed } from 'lucide-react';
import type { Dish } from '@/types/menu';

interface FloatingIngredientAnnotationsProps {
  dish: Dish;
  visible: boolean;
}

interface IngredientPin {
  id: string;
  name: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  iconType: 'droplet' | 'sparkles' | 'flame' | 'leaf' | 'utensils';
}

export function FloatingIngredientAnnotations({ dish, visible }: FloatingIngredientAnnotationsProps) {
  if (!visible) return null;

  const slug = (dish.slug || '').toLowerCase();
  const category = ((dish.category as string) || '').toLowerCase();
  const ing = dish.ingredients && dish.ingredients.length >= 4 ? dish.ingredients : null;

  let pins: IngredientPin[];

  if (slug.includes('pizza') || category.includes('pizza')) {
    pins = [
      { id: 'truffle', name: ing?.[0] || 'Black Truffle Oil', position: 'top-left', iconType: 'droplet' },
      { id: 'parmesan', name: ing?.[1] || 'Aged Parmesan', position: 'top-right', iconType: 'sparkles' },
      { id: 'mushrooms', name: ing?.[2] || 'Wild Mushrooms', position: 'bottom-left', iconType: 'leaf' },
      { id: 'thyme', name: ing?.[3] || 'Fresh Thyme', position: 'bottom-right', iconType: 'flame' },
    ];
  } else if (slug.includes('burger') || category.includes('burger')) {
    pins = [
      { id: 'patty', name: ing?.[0] || 'Double Smash Patty', position: 'top-left', iconType: 'flame' },
      { id: 'cheddar', name: ing?.[1] || 'Aged Cheddar', position: 'top-right', iconType: 'sparkles' },
      { id: 'brioche', name: ing?.[2] || 'Toasted Brioche', position: 'bottom-left', iconType: 'utensils' },
      { id: 'aioli', name: ing?.[3] || 'Truffle Aioli', position: 'bottom-right', iconType: 'droplet' },
    ];
  } else if (slug.includes('mocktail') || category.includes('drink') || category.includes('beverage')) {
    pins = [
      { id: 'citrus', name: ing?.[0] || 'Kaffir Lime Leaf', position: 'top-left', iconType: 'leaf' },
      { id: 'zest', name: ing?.[1] || 'Chilled Botanicals', position: 'top-right', iconType: 'sparkles' },
      { id: 'tonic', name: ing?.[2] || 'Craft Citrus Tonic', position: 'bottom-left', iconType: 'droplet' },
      { id: 'ice', name: ing?.[3] || 'Crystal Ice Serve', position: 'bottom-right', iconType: 'utensils' },
    ];
  } else {
    pins = [
      { id: 'char', name: ing?.[0] || 'Chef Signature', position: 'top-left', iconType: 'flame' },
      { id: 'spice', name: ing?.[1] || 'Aromatic Spices', position: 'top-right', iconType: 'sparkles' },
      { id: 'garlic', name: ing?.[2] || 'Artisan Glaze', position: 'bottom-left', iconType: 'droplet' },
      { id: 'scallion', name: ing?.[3] || 'Crispy Herbs', position: 'bottom-right', iconType: 'leaf' },
    ];
  }

  const renderIcon = (type: string) => {
    switch (type) {
      case 'droplet':
        return (
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#F0C36B]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        );
      case 'cheese':
      case 'sparkles':
        return (
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#F0C36B]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 14l16-6v10L3 18z" />
            <circle cx="8" cy="15" r="1" fill="#F0C36B" />
            <circle cx="13" cy="13" r="1.2" fill="#F0C36B" />
          </svg>
        );
      case 'mushroom':
      case 'leaf':
        return (
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#F0C36B]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 13c0-4.4 3.6-8 8-8s8 3.6 8 8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
            <path d="M10 15v4a2 2 0 0 0 4 0v-4" />
          </svg>
        );
      case 'thyme':
      case 'flame':
        return (
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#F0C36B]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" />
            <path d="M2 21c0-3 1.9-5.4 5.1-6" />
          </svg>
        );
      default:
        return <UtensilsCrossed className="w-3.5 h-3.5 text-[#F0C36B]" />;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden pt-16 pb-[215px] px-3 sm:pt-16 sm:pb-28 sm:pl-20 sm:pr-[344px] md:pr-[368px] lg:pr-[392px] xl:pr-[418px]">
      <div className="relative w-full max-w-[360px] sm:max-w-[560px] lg:max-w-[680px] h-full max-h-[340px] sm:max-h-[440px]">
        {/* Top-Left Pin */}
        <div className="absolute top-2 sm:top-6 left-1 sm:left-[6%] lg:left-[12%] flex flex-col items-start sm:items-center animate-in fade-in duration-300 max-w-[168px] sm:max-w-none">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-black/75 backdrop-blur-xl border border-[#F0C36B]/50 shadow-[0_0_16px_rgba(240,195,107,0.35)]">
            {renderIcon(pins[0].iconType)}
            <span className="text-[11px] sm:text-xs font-semibold text-[#F8F2E8] tracking-wide truncate max-w-[125px] sm:max-w-none">
              {pins[0].name}
            </span>
          </div>
          {/* Fine Gold Leader Line */}
          <svg className="hidden sm:block w-16 h-12 overflow-visible -mt-0.5 pointer-events-none">
            <path
              d="M 32 0 L 32 16 L 50 36"
              fill="none"
              stroke="#F0C36B"
              strokeWidth="1.2"
              strokeOpacity="0.8"
            />
            <circle cx="50" cy="36" r="2.5" fill="#F0C36B" />
          </svg>
        </div>

        {/* Top-Right Pin (staggered vertically below Top-Left on small phones to prevent overlap) */}
        <div className="absolute top-12 sm:top-6 right-1 sm:right-[6%] lg:right-[12%] flex flex-col items-end sm:items-center animate-in fade-in duration-300 max-w-[168px] sm:max-w-none">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-black/75 backdrop-blur-xl border border-[#F0C36B]/50 shadow-[0_0_16px_rgba(240,195,107,0.35)]">
            {renderIcon(pins[1].iconType)}
            <span className="text-[11px] sm:text-xs font-semibold text-[#F8F2E8] tracking-wide truncate max-w-[125px] sm:max-w-none">
              {pins[1].name}
            </span>
          </div>
          {/* Fine Gold Leader Line */}
          <svg className="hidden sm:block w-16 h-12 overflow-visible -mt-0.5 pointer-events-none">
            <path
              d="M 32 0 L 32 16 L 14 36"
              fill="none"
              stroke="#F0C36B"
              strokeWidth="1.2"
              strokeOpacity="0.8"
            />
            <circle cx="14" cy="36" r="2.5" fill="#F0C36B" />
          </svg>
        </div>

        {/* Bottom-Left Pin */}
        <div className="absolute bottom-12 sm:bottom-[18%] left-1 sm:left-[2%] lg:left-[6%] flex flex-col items-start sm:items-center animate-in fade-in duration-300 max-w-[168px] sm:max-w-none">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-black/75 backdrop-blur-xl border border-[#F0C36B]/50 shadow-[0_0_16px_rgba(240,195,107,0.35)]">
            {renderIcon(pins[2].iconType)}
            <span className="text-[11px] sm:text-xs font-semibold text-[#F8F2E8] tracking-wide truncate max-w-[125px] sm:max-w-none">
              {pins[2].name}
            </span>
          </div>
          {/* Fine Gold Leader Line */}
          <svg className="hidden sm:block w-16 h-12 overflow-visible -mt-0.5 pointer-events-none">
            <path
              d="M 32 0 L 32 16 L 54 34"
              fill="none"
              stroke="#F0C36B"
              strokeWidth="1.2"
              strokeOpacity="0.8"
            />
            <circle cx="54" cy="34" r="2.5" fill="#F0C36B" />
          </svg>
        </div>

        {/* Bottom-Right Pin */}
        <div className="absolute bottom-2 sm:bottom-[14%] right-1 sm:right-[2%] lg:right-[6%] flex flex-col items-end sm:items-center animate-in fade-in duration-300 max-w-[168px] sm:max-w-none">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-black/75 backdrop-blur-xl border border-[#F0C36B]/50 shadow-[0_0_16px_rgba(240,195,107,0.35)]">
            {renderIcon(pins[3].iconType)}
            <span className="text-[11px] sm:text-xs font-semibold text-[#F8F2E8] tracking-wide truncate max-w-[125px] sm:max-w-none">
              {pins[3].name}
            </span>
          </div>
          {/* Fine Gold Leader Line */}
          <svg className="hidden sm:block w-16 h-12 overflow-visible -mt-0.5 pointer-events-none">
            <path
              d="M 32 0 L 32 16 L 10 34"
              fill="none"
              stroke="#F0C36B"
              strokeWidth="1.2"
              strokeOpacity="0.8"
            />
            <circle cx="10" cy="34" r="2.5" fill="#F0C36B" />
          </svg>
        </div>
      </div>
    </div>
  );
}
