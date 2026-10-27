'use client';

import React from 'react';
import { Droplet, Sparkles, Flame, Leaf, UtensilsCrossed } from 'lucide-react';
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
  const category = (dish.category as string || '').toLowerCase();

  let pins: IngredientPin[];

  if (slug.includes('pizza') || category.includes('pizza')) {
    pins = [
      { id: 'truffle', name: 'Black Truffle Oil', position: 'top-left', iconType: 'droplet' },
      { id: 'parmesan', name: 'Aged Parmesan', position: 'top-right', iconType: 'sparkles' },
      { id: 'mushrooms', name: 'Wild Mushrooms', position: 'bottom-left', iconType: 'leaf' },
      { id: 'thyme', name: 'Fresh Thyme', position: 'bottom-right', iconType: 'flame' },
    ];
  } else if (slug.includes('burger') || category.includes('burger')) {
    pins = [
      { id: 'patty', name: 'Double Smash Patty', position: 'top-left', iconType: 'flame' },
      { id: 'cheddar', name: 'Aged Cheddar', position: 'top-right', iconType: 'sparkles' },
      { id: 'brioche', name: 'Toasted Brioche', position: 'bottom-left', iconType: 'utensils' },
      { id: 'aioli', name: 'Truffle Aioli', position: 'bottom-right', iconType: 'droplet' },
    ];
  } else {
    pins = [
      { id: 'char', name: 'Flame Charred', position: 'top-left', iconType: 'flame' },
      { id: 'spice', name: 'Birds Eye Chilli', position: 'top-right', iconType: 'sparkles' },
      { id: 'garlic', name: 'Garlic Butter Glaze', position: 'bottom-left', iconType: 'droplet' },
      { id: 'scallion', name: 'Crispy Herbs', position: 'bottom-right', iconType: 'leaf' },
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
    <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden -translate-y-6 sm:-translate-y-10">
      <div className="relative w-full max-w-4xl h-[420px] sm:h-[480px]">
        {/* Top-Left Pin: Black Truffle Oil */}
        <div className="absolute top-10 left-[26%] sm:left-[32%] flex flex-col items-center group pointer-events-auto cursor-pointer animate-in fade-in duration-300">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-xl border border-[#F0C36B]/50 shadow-[0_0_16px_rgba(240,195,107,0.35)] hover:border-[#F0C36B] hover:scale-105 transition-all">
            {renderIcon(pins[0].iconType)}
            <span className="text-xs font-semibold text-[#F8F2E8] tracking-wide whitespace-nowrap">
              {pins[0].name}
            </span>
          </div>
          {/* Fine Gold Leader Line */}
          <svg className="w-16 h-12 overflow-visible -mt-0.5 pointer-events-none">
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

        {/* Top-Right Pin: Aged Parmesan */}
        <div className="absolute top-10 right-[26%] sm:right-[32%] flex flex-col items-center group pointer-events-auto cursor-pointer animate-in fade-in duration-300">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-xl border border-[#F0C36B]/50 shadow-[0_0_16px_rgba(240,195,107,0.35)] hover:border-[#F0C36B] hover:scale-105 transition-all">
            {renderIcon(pins[1].iconType)}
            <span className="text-xs font-semibold text-[#F8F2E8] tracking-wide whitespace-nowrap">
              {pins[1].name}
            </span>
          </div>
          {/* Fine Gold Leader Line */}
          <svg className="w-16 h-12 overflow-visible -mt-0.5 pointer-events-none">
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

        {/* Mid-Left Pin: Wild Mushrooms */}
        <div className="absolute top-[38%] left-[12%] sm:left-[22%] flex flex-col items-center group pointer-events-auto cursor-pointer animate-in fade-in duration-300">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-xl border border-[#F0C36B]/50 shadow-[0_0_16px_rgba(240,195,107,0.35)] hover:border-[#F0C36B] hover:scale-105 transition-all">
            {renderIcon(pins[2].iconType)}
            <span className="text-xs font-semibold text-[#F8F2E8] tracking-wide whitespace-nowrap">
              {pins[2].name}
            </span>
          </div>
          {/* Fine Gold Leader Line */}
          <svg className="w-16 h-12 overflow-visible -mt-0.5 pointer-events-none">
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

        {/* Mid-Right Pin: Fresh Thyme */}
        <div className="absolute top-[42%] right-[12%] sm:right-[22%] flex flex-col items-center group pointer-events-auto cursor-pointer animate-in fade-in duration-300">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-xl border border-[#F0C36B]/50 shadow-[0_0_16px_rgba(240,195,107,0.35)] hover:border-[#F0C36B] hover:scale-105 transition-all">
            {renderIcon(pins[3].iconType)}
            <span className="text-xs font-semibold text-[#F8F2E8] tracking-wide whitespace-nowrap">
              {pins[3].name}
            </span>
          </div>
          {/* Fine Gold Leader Line */}
          <svg className="w-16 h-12 overflow-visible -mt-0.5 pointer-events-none">
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
