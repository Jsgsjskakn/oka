'use client';

import React from 'react';
import {
  Pizza,
  Flame,
  Coffee,
  Wine,
  IceCream,
  UtensilsCrossed,
  Sparkles,
  ArrowUpRight,
  LucideIcon,
} from 'lucide-react';

const iconComponentMap: Record<string, LucideIcon> = {
  pizza: Pizza,
  burger: Flame,
  utensils: UtensilsCrossed,
  flame: Flame,
  'ice-cream': IceCream,
  coffee: Coffee,
  chinese: UtensilsCrossed,
  starters: Sparkles,
  desserts: IceCream,
  drinks: Wine,
  'view-all': ArrowUpRight,
  'arrow-up-right': ArrowUpRight,
};

interface CategoryChipProps {
  icon: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function CategoryChip({ icon, label, isActive = false, onClick }: CategoryChipProps) {
  const IconComponent = iconComponentMap[icon] || UtensilsCrossed;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-2xl whitespace-nowrap text-xs sm:text-sm transition-all duration-200 select-none ${
        isActive
          ? 'bg-gradient-to-r from-[#d4af37] to-[#b38936] text-[#0D0A08] font-bold shadow-[0_6px_20px_rgba(212,175,55,0.25)] scale-[1.02]'
          : 'bg-[#09150d]/80 border border-white/10 text-white/70 hover:text-white hover:border-white/25 hover:bg-[#0c1a10]'
      }`}
    >
      <IconComponent className="w-4 h-4 shrink-0" />
      <span className="tracking-tight">{label}</span>
    </button>
  );
}
