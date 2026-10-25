'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { Dish } from '@/types/menu';

interface ARDishInfoProps {
  dish: Dish;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddToCart: () => void;
  onViewDetails: () => void;
}

export function ARDishInfo({ 
  dish, 
  isFavorite, 
  onToggleFavorite, 
  onAddToCart, 
  onViewDetails 
}: ARDishInfoProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-obsidian/70 backdrop-blur-lg border-t border-white/5 pb-safe">
      <div className="p-4 flex items-center justify-between">
        
        {/* Left: Dish Info */}
        <div 
          className="flex-1 flex flex-col mr-4 overflow-hidden cursor-pointer"
          onClick={onViewDetails}
        >
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-semibold text-text-primary truncate">{dish.name}</span>
            {dish.isVeg !== undefined && (
              <div className={`w-3 h-3 rounded-sm flex items-center justify-center border ${dish.isVeg ? 'border-green-500' : 'border-red-500'} flex-shrink-0`}>
                <div className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
            )}
            <span className="text-[9px] bg-amber-500/10 text-amber-300/80 px-1.5 py-0.5 rounded shrink-0 border border-amber-500/20">
              Shared Prototype
            </span>
          </div>
          <span className="text-champagne font-bold text-xs">₹{dish.price}</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-border-subtle transition-transform active:scale-95"
          >
            <Heart 
              className={`w-5 h-5 ${isFavorite ? 'fill-[#c9a84c] text-champagne' : 'text-text-primary'}`} 
            />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
            className="px-5 py-2.5 rounded-full bg-champagne text-black font-semibold text-xs transition-transform active:scale-95"
          >
            Add to Cart
          </button>
        </div>
        
      </div>
    </div>
  );
}
