'use client';

import Image from 'next/image';
import { Plus, Sparkles } from 'lucide-react';
import type { Dish } from '@/types/menu';

interface DishCardProps {
  dish: Dish;
  onAdd?: (dish: Dish) => void;
}

export function DishCard({ dish, onAdd }: DishCardProps) {
  return (
    <div className="flex-none w-[280px] glass-card rounded-2xl overflow-hidden group transition-transform hover:scale-[1.02]">
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={dish.image || '/images/dishes/placeholder.jpg'}
          alt={dish.name}
          fill
          className="object-cover"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {dish.isFeatured && (
            <span className="px-2 py-1 bg-obsidian/80 backdrop-blur-md rounded-md text-[10px] font-medium text-primary border border-primary/30 uppercase tracking-wider">
              Featured
            </span>
          )}
          {dish.isBestSeller && (
            <span className="px-2 py-1 bg-gradient-to-r from-red-600 to-orange-500 rounded-md text-[10px] font-medium text-text-primary shadow-lg uppercase tracking-wider">
              Best Seller
            </span>
          )}
        </div>

        {dish.has3DModel && (
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-obsidian/60 backdrop-blur-md flex items-center justify-center border border-border-subtle">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>

      <div className="p-4 relative">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-heading text-base font-semibold text-text-primary line-clamp-1">{dish.name}</h3>
          <div className="flex items-center justify-center w-4 h-4 rounded-sm bg-white p-0.5 mt-1 shrink-0">
            <div className={`w-2 h-2 rounded-full ${dish.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 h-8">
          {dish.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-lg font-medium text-primary">₹{dish.price}</span>
          <button 
            onClick={() => onAdd?.(dish)}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-champagne to-[#e8c547] flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
