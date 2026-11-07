'use client';

import React, { useState } from 'react';
import {
  Minus,
  Plus,
  Check,
  ShoppingCart,
} from 'lucide-react';
import type { Dish, AddOn } from '@/types/menu';

interface DishInfoBarProps {
  dish: Dish;
  onAddToCart: (quantity?: number, selectedAddOns?: AddOn[]) => void;
  onViewDetails?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function DishInfoBar({
  dish,
  onAddToCart,
}: DishInfoBarProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const baseUnitPrice = dish.price || 0;
  const grandTotal = Math.round(baseUnitPrice * quantity);

  const handleMinus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > 1) {
      setQuantity((q) => q - 1);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(8);
    }
  };

  const handlePlus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity < 20) {
      setQuantity((q) => q + 1);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(8);
    }
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(quantity, []);
    setAdded(true);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(20);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <aside
      className="fixed bottom-3 sm:bottom-4 lg:bottom-5 left-1/2 -translate-x-1/2 w-[calc(100vw-36px)] max-w-[330px] sm:max-w-[350px] z-40 pointer-events-auto select-none flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300"
      aria-label="Dish Order Console"
    >
      <div className="rounded-xl sm:rounded-2xl py-2 px-3 sm:py-2.5 sm:px-3.5 bg-[rgba(16,12,9,0.92)] backdrop-blur-2xl border border-[#F0C36B]/40 shadow-[0_10px_28px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col gap-1.5">
        {/* Row 1: Veg Dot, Dish Name, Category Tag & Price */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 shadow-sm ${
                dish.isVeg ? 'bg-emerald-400 shadow-[0_0_6px_#34D399]' : 'bg-red-500 shadow-[0_0_6px_#EF4444]'
              }`}
              title={dish.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
            />
            <h2 className="font-serif text-xs sm:text-[13px] font-bold text-[#F8F2E8] truncate">
              {dish.name}
            </h2>
            <span className="shrink-0 px-1.5 py-0.2 rounded-full bg-black/60 border border-white/10 text-[#FAF5EC]/75 text-[7.5px] font-mono uppercase tracking-wider">
              {dish.category || 'Special'}
            </span>
          </div>

          <div className="flex items-center shrink-0">
            <span className="font-mono text-sm sm:text-[15px] font-bold text-[#FAF5EC] tracking-tight">
              ₹{grandTotal}
            </span>
          </div>
        </div>

        {/* Row 2: Quantity Stepper & Add to Cart (Ultra Slim & Compact) */}
        <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-white/[0.06]">
          {/* Stepper [ - 1 + ] */}
          <div className="flex items-center bg-black/60 border border-[#F0C36B]/35 rounded-full p-0.5">
            <button
              type="button"
              onClick={handleMinus}
              disabled={quantity <= 1}
              className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[#F0C36B] hover:bg-[#F0C36B]/15 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <span className="w-5 text-center font-mono text-[11px] sm:text-xs font-bold text-[#F8F2E8]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={handlePlus}
              disabled={quantity >= 20}
              className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[#F0C36B] hover:bg-[#F0C36B]/15 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Add to Cart CTA */}
          {added ? (
            <div className="rounded-lg px-3 py-1 bg-[#0A261C] border border-[#36D6A0]/50 text-[#36D6A0] font-bold text-[11px] sm:text-xs flex items-center gap-1 shadow-[0_0_12px_rgba(54,214,160,0.3)]">
              <Check className="w-3 h-3 text-[#36D6A0]" />
              <span>Added</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-lg px-3 py-1 bg-gradient-to-r from-[#F0C36B] to-[#D4A346] text-[#120E0B] font-bold text-[11px] sm:text-xs flex items-center gap-1 shadow-[0_2px_10px_rgba(240,195,107,0.35)] hover:shadow-[0_4px_14px_rgba(240,195,107,0.5)] active:scale-95 transition-all cursor-pointer border border-[#FFE3A5]/40"
            >
              <ShoppingCart className="w-3 h-3 text-[#120E0B]" />
              <span className="whitespace-nowrap">Add to Cart</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
