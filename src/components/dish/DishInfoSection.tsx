'use client';

import type { Dish } from '@/types/menu';

interface DishInfoSectionProps {
  dish: Dish;
}

export function DishInfoSection({ dish }: DishInfoSectionProps) {
  return (
    <div className="px-4 pt-2 pb-6">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary leading-tight flex-1">
          {dish.name}
        </h1>
        <div className="flex flex-col items-end shrink-0 mt-1">
          <div className="flex items-center gap-1.5 bg-[#1a1a1a] px-2 py-1 rounded-md border border-white/5">
            <div className={`w-2 h-2 rounded-full ${dish.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-[10px] font-medium text-text-primary/70 uppercase tracking-wider">
              {dish.isVeg ? 'Veg' : 'Non-Veg'}
            </span>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-text-primary/70 leading-relaxed mb-4">
        {dish.description}
      </p>
      
      <div className="flex flex-wrap gap-2 mb-2">
        {dish.isFeatured && (
          <span className="px-2.5 py-1 bg-[#1a1a1a] rounded-md text-[10px] font-medium text-primary border border-primary/20 uppercase tracking-wider">
            Signature
          </span>
        )}
        {dish.isBestSeller && (
          <span className="px-2.5 py-1 bg-gradient-to-r from-red-600/20 to-orange-500/20 rounded-md text-[10px] font-medium text-orange-400 border border-orange-500/20 uppercase tracking-wider">
            Best Seller
          </span>
        )}
        <span className="px-2.5 py-1 bg-[#1a1a1a] rounded-md text-[10px] font-medium text-text-primary/50 border border-white/5 uppercase tracking-wider">
          {dish.calories} kcal
        </span>
        <span className="px-2.5 py-1 bg-[#1a1a1a] rounded-md text-[10px] font-medium text-text-primary/50 border border-white/5 uppercase tracking-wider">
          {dish.preparationTime}
        </span>
      </div>
    </div>
  );
}
