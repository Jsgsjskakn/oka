'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { Dish } from '@/types/menu';

interface DishInfoBarProps {
  dish: Dish;
  onAddToCart: () => void;
  onViewDetails: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function DishInfoBar({
  dish,
  onAddToCart,
  onViewDetails,
  isFavorite,
  onToggleFavorite,
}: DishInfoBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-obsidian/80 backdrop-blur-lg border-t border-white/5 pb-safe">
      <div className="flex items-center justify-between px-4 py-4 max-w-7xl mx-auto w-full">
        <div className="flex-1 min-w-0 pr-4 cursor-pointer" onClick={onViewDetails}>
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-heading text-sm font-semibold text-text-primary truncate">{dish.name}</h3>
            <div className="flex items-center space-x-1 bg-white/5 px-1.5 py-0.5 rounded-full shrink-0">
              <span className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-[9px] text-text-primary/80">{dish.isVeg ? 'Veg' : 'Non-Veg'}</span>
            </div>
            <span className="text-[9px] bg-amber-500/10 text-amber-300/80 px-1.5 py-0.5 rounded shrink-0 border border-amber-500/20">
              Shared 3D Asset
            </span>
          </div>
          <p className="text-[10px] text-text-primary/40 line-clamp-1 mb-1">{dish.description}</p>
          <div className="text-primary font-bold text-sm">₹{dish.price}</div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Heart
              size={18}
              className={`${isFavorite ? 'fill-primary text-primary' : 'text-text-primary/60'}`}
            />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
            className="bg-primary hover:bg-primary/90 text-black rounded-full px-4 py-2.5 text-xs font-semibold transition-colors shadow-[0_0_15px_rgba(201,168,76,0.3)]"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
