'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Heart, Check } from 'lucide-react';
import { Dish } from '@/types/menu';

interface ARDishInfoProps {
  dish: Dish;
  isFavorite: boolean;
  isSharedPlaceholder?: boolean;
  onToggleFavorite: () => void;
  onAddToCart: () => void;
  onViewDetails: () => void;
}

export function ARDishInfo({ 
  dish, 
  isFavorite, 
  isSharedPlaceholder = false,
  onToggleFavorite, 
  onAddToCart, 
  onViewDetails 
}: ARDishInfoProps) {
  const dishKey = dish.slug || dish.id;
  const [addedForKey, setAddedForKey] = useState<string | null>(null);
  const added = addedForKey === dishKey;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [dishKey]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart();
    setAddedForKey(dishKey);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAddedForKey(null), 1800);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-obsidian/80 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        
        {/* Left: Dish Info */}
        <button
          type="button"
          className="flex-1 flex flex-col mr-2 overflow-hidden cursor-pointer text-left touch-manipulation"
          onClick={onViewDetails}
        >
          <div className="flex items-center space-x-2 mb-0.5 min-w-0">
            <span className="text-sm font-semibold text-text-primary truncate">{dish.name}</span>
            {dish.isVeg !== undefined && (
              <div className={`w-3 h-3 rounded-sm flex items-center justify-center border ${dish.isVeg ? 'border-green-500' : 'border-red-500'} flex-shrink-0`}>
                <div className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
            )}
            <span className="text-[9px] bg-amber-500/10 text-amber-300/80 px-1.5 py-0.5 rounded shrink-0 border border-amber-500/20">
              {isSharedPlaceholder ? 'Prototype' : '1:1 AR Scale'}
            </span>
          </div>
          <span className="text-champagne font-bold text-xs">₹{dish.price}</span>
        </button>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-border-subtle transition-transform active:scale-95 cursor-pointer touch-manipulation"
          >
            <Heart 
              className={`w-5 h-5 ${isFavorite ? 'fill-[#c9a84c] text-champagne' : 'text-text-primary'}`} 
            />
          </button>
          
          <button
            type="button"
            onClick={handleAdd}
            className={`px-5 min-h-[44px] rounded-full font-semibold text-xs transition-all active:scale-95 cursor-pointer touch-manipulation flex items-center gap-1.5 ${
              added
                ? 'bg-[#0A261C] border border-[#36D6A0]/60 text-[#36D6A0]'
                : 'bg-champagne text-black hover:brightness-105'
            }`}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <span>Add to Cart</span>
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
}
