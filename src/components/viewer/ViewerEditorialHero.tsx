'use client';

import React from 'react';
import type { Dish } from '@/types/menu';

interface ViewerEditorialHeroProps {
  dish: Dish;
  onExplore3D?: () => void;
}

export function ViewerEditorialHero({}: ViewerEditorialHeroProps) {
  return (
    <div className="absolute left-6 sm:left-10 top-20 sm:top-24 z-30 pointer-events-none max-w-sm hidden lg:flex flex-col items-start text-left select-none animate-in fade-in slide-in-from-left-4 duration-500">
      {/* Eyebrow & Display Title */}
      <span className="font-serif italic text-2xl sm:text-3xl text-[#F0C36B] font-normal leading-tight">
        Experience
      </span>
      <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#F8F2E8] tracking-tight leading-none mb-2">
        Food in <span className="italic text-[#F0C36B]">3D</span>
      </h1>
      <p className="text-xs sm:text-[13px] text-[#A99A88] font-light leading-relaxed max-w-xs">
        Explore every detail. Order with confidence.
      </p>
    </div>
  );
}
