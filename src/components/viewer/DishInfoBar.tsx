'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Minus, Plus, Check, Box } from 'lucide-react';
import type { Dish } from '@/types/menu';

interface DishInfoBarProps {
  dish: Dish;
  onAddToCart: (quantity?: number) => void;
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
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const totalPrice = Math.round(dish.price * quantity);

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
    onAddToCart(quantity);
    setAdded(true);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(20);
    setTimeout(() => setAdded(false), 2200);
  };

  // Determine authentic culinary specs by dish type
  const getCulinarySpecs = () => {
    const slug = dish.slug.toLowerCase();
    const cat = (dish.category as string || '').toLowerCase();
    if (slug.includes('pizza') || cat.includes('pizza')) {
      return ['Wood-Fired', '12" Artisan Crust', '15 Mins Prep'];
    }
    if (slug.includes('burger') || cat.includes('burger')) {
      return ['Charcoal Grilled', 'Toasted Brioche', '12 Mins Prep'];
    }
    return ['Flame Wok', 'Farm Fresh Herbs', '10 Mins Prep'];
  };

  const culinarySpecs = getCulinarySpecs();

  return (
    <footer
      className="fixed bottom-4 sm:bottom-6 left-3 sm:left-6 right-3 sm:right-6 max-w-[1240px] mx-auto z-40 pointer-events-auto"
      aria-label="Dish Summary & Order Console"
    >
      <div
        className="rounded-2xl p-4 sm:p-6 sm:px-8 border border-[rgba(226,168,75,0.25)] border-t-[rgba(246,211,134,0.45)] shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6"
        style={{
          background:
            'linear-gradient(180deg, rgba(24, 19, 15, 0.94) 0%, rgba(13, 10, 8, 0.98) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Left Zone: Dish Editorial Identity (55% width) */}
        <div
          className="flex-1 min-w-0 cursor-pointer group"
          onClick={onViewDetails}
          title="Click to view full recipe details"
        >
          {/* Title Row + Veg/Non-Veg + Culinary Specs */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5">
            <h2 className="font-serif text-xl sm:text-[26px] md:text-[28px] font-bold text-[#FAF5EC] tracking-tight leading-tight group-hover:text-[#E2A84B] transition-colors truncate">
              {dish.name}
            </h2>

            {/* Veg / Non-Veg Subtle Crimson/Emerald Badge */}
            {dish.isVeg ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#0E1F18] border border-[#22C58B]/30 text-[10px] font-semibold text-[#86EFAC]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C58B] shadow-[0_0_6px_#22C58B]" />
                Pure Veg
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#2A0B12] border border-[#F43F5E]/30 text-[10px] font-semibold text-[#FCA5A5]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E] shadow-[0_0_6px_#F43F5E]" />
                Non-Veg
              </span>
            )}

            {/* Culinary Specs Tags (Replaced developer Shared 3D Asset badge) */}
            <div className="hidden sm:inline-flex items-center gap-1.5">
              {culinarySpecs.map((spec, i) => (
                <span
                  key={i}
                  className="text-[11px] font-medium tracking-wide text-[#E2A84B]/90 bg-[#1F1710] border border-[#E2A84B]/20 rounded-md px-2 py-0.5"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>

          {/* Description in Warm Stone (#B5ADA2, 14px) */}
          <p className="text-xs sm:text-[13.5px] text-[#B5ADA2] font-light leading-relaxed line-clamp-2 max-w-2xl">
            {dish.description}
          </p>
        </div>

        {/* Right Zone: Conversion & Action Cluster (45% width, Right-Aligned) */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3.5 shrink-0 pt-2 lg:pt-0 border-t border-white/[0.06] lg:border-t-0 flex-wrap sm:flex-nowrap">
          {/* View in AR Button */}
          <Link
            href={`/ar/${dish.slug}`}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-[10px] bg-[#16120E] border border-[rgba(226,168,75,0.35)] hover:border-[#E2A84B] hover:bg-[#E2A84B]/10 text-[#FAF5EC] hover:text-[#E2A84B] text-xs sm:text-[13px] font-semibold transition-all active:scale-95 shadow-sm group whitespace-nowrap"
            title="View this dish in Augmented Reality (AR)"
          >
            <Box className="w-4 h-4 text-[#E2A84B] group-hover:scale-110 transition-transform" />
            <span>View in AR</span>
          </Link>

          {/* 1. Total Price Display (Positioned right next to Add to Cart) */}
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-[9px] uppercase tracking-widest text-[#9A9286] font-semibold">
              TOTAL PRICE
            </span>
            <span className="font-mono text-xl sm:text-[24px] md:text-[26px] font-bold text-[#FAF5EC] leading-tight">
              ₹{totalPrice}
            </span>
          </div>

          {/* 2. Quantity Stepper [ −  1  + ] */}
          <div className="flex items-center bg-[#16120E] border border-[rgba(226,168,75,0.25)] rounded-lg p-1">
            <button
              onClick={handleMinus}
              disabled={quantity <= 1}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center text-[#E2A84B] hover:bg-[#E2A84B]/10 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-7 sm:w-8 text-center font-mono text-xs sm:text-sm font-bold text-[#FAF5EC]">
              {quantity}
            </span>
            <button
              onClick={handlePlus}
              disabled={quantity >= 20}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center text-[#E2A84B] hover:bg-[#E2A84B]/10 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3. Wishlist Heart Button (48x48px rounded-square) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
              if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10);
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-[10px] bg-white/[0.04] border border-[rgba(226,168,75,0.25)] hover:border-[#E2A84B] flex items-center justify-center transition-all group active:scale-90"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`w-5 h-5 transition-transform duration-200 ${
                isFavorite
                  ? 'fill-[#E0532B] text-[#E0532B] scale-110'
                  : 'text-[#9A9286] group-hover:text-[#FAF5EC]'
              }`}
            />
          </button>

          {/* 4. Liquid Gold CTA Button */}
          {added ? (
            <div className="rounded-[10px] px-5 sm:px-7 py-3 sm:py-3.5 bg-[#0E1F18] border border-[#22C58B]/50 text-[#22C58B] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,139,0.3)] animate-in zoom-in-95 duration-200">
              <Check className="w-4 h-4 text-[#22C58B]" />
              <span>Added to Table Order</span>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="relative overflow-hidden group rounded-[10px] px-5 sm:px-7 py-3 sm:py-3.5 font-bold text-[#0D0A08] text-xs sm:text-[14.5px] tracking-wide transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(226,168,75,0.45)] active:translate-y-0 active:scale-95 flex items-center gap-2"
              style={{
                background:
                  'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
              }}
            >
              {/* Subtle Shimmer Sweep */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform pointer-events-none" />
              <span>Add to Order · ₹{totalPrice} →</span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
