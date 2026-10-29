'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Minus,
  Plus,
  Check,
  Sparkles,
  Flame,
  Clock,
  Ruler,
  Leaf,
  Box,
  Wine,
  Info,
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
  onViewDetails,
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

  // Determine authentic culinary specs by dish type
  const getCulinarySpecs = () => {
    const slug = (dish.slug || '').toLowerCase();
    const cat = ((dish.category as string) || '').toLowerCase();
    if (slug.includes('pizza') || cat.includes('pizza')) {
      return [
        { label: 'Wood-Fired', icon: Flame },
        { label: '12" Artisan Crust', icon: Ruler },
        { label: '15 Mins Prep', icon: Clock },
      ];
    }
    if (slug.includes('burger') || cat.includes('burger')) {
      return [
        { label: 'Charcoal Grilled', icon: Flame },
        { label: 'Toasted Brioche', icon: Sparkles },
        { label: '12 Mins Prep', icon: Clock },
      ];
    }
    return [
      { label: 'Flame Wok', icon: Flame },
      { label: 'Farm Fresh Herbs', icon: Leaf },
      { label: '10 Mins Prep', icon: Clock },
    ];
  };

  const culinarySpecs = getCulinarySpecs();

  // Curated ingredients fallback if not provided
  const displayIngredients =
    dish.ingredients && dish.ingredients.length > 0
      ? dish.ingredients
      : (dish.slug || '').includes('pizza')
      ? ['Black Truffle Oil', 'Wild Porcini', 'Aged Parmesan', 'Fresh Thyme', 'Buffalo Mozzarella', 'Fermented Sourdough']
      : ['Artisan Brioche', 'Aged Cheddar', 'Crisp Butterhead', 'Smoked Glaze', 'Organic Microgreens'];

  return (
    <aside
      className="fixed bottom-3 sm:bottom-4 lg:bottom-4 xl:bottom-5 right-3 sm:right-5 lg:right-6 xl:right-8 top-auto w-[calc(100vw-24px)] sm:w-[340px] lg:w-[350px] xl:w-[370px] z-40 pointer-events-auto select-none flex flex-col gap-2 sm:gap-2.5 animate-in fade-in slide-in-from-right-4 duration-300 max-h-[calc(100vh-40px)] overflow-y-auto no-scrollbar"
      aria-label="Dish Dossier & Order Console"
    >
      {/* ========================================================================= */}
      {/* ZONE 1 (Top Box): High-Resolution Dish Photography, Name & Description     */}
      {/* ========================================================================= */}
      <div className="rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 bg-[rgba(16,12,9,0.90)] backdrop-blur-2xl border border-[#F0C36B]/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_16px_40px_rgba(0,0,0,0.85)] flex flex-col gap-2">
        {/* Dish Photography Hero */}
        <div
          className="relative w-full h-24 sm:h-28 xl:h-32 rounded-xl sm:rounded-2xl overflow-hidden border border-[#F0C36B]/50 shrink-0 shadow-lg bg-[#16120E] group cursor-pointer"
          onClick={onViewDetails}
          title="Click to view full dish details"
        >
          <img
            src={dish.image || '/images/dishes/placeholder.jpg'}
            alt={dish.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Cinematic Bottom Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

          {/* Floating Top-Left Badges: Veg Dot & Category */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
            <span
              className={`w-2.5 h-2.5 rounded-full shadow-md ${
                dish.isVeg ? 'bg-emerald-400 shadow-[0_0_8px_#34D399]' : 'bg-red-500 shadow-[0_0_8px_#EF4444]'
              }`}
              title={dish.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
            />
            <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[#FAF5EC] text-[9.5px] font-medium font-mono uppercase tracking-wider shadow-md">
              {dish.category || 'Artisan Special'}
            </span>
          </div>

          {/* Floating Top-Right: Premium Sparkle Badge */}
          <div className="absolute top-2 right-2 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-[#F0C36B]/60 text-[#FFE3A5] text-[9.5px] font-bold font-mono shadow-md">
              <Sparkles className="w-2.5 h-2.5 text-[#F0C36B]" />
              <span>Premium</span>
            </span>
          </div>
        </div>

        {/* Dish Title & Culinary Specs */}
        <div>
          <h2 className="font-serif text-base sm:text-lg font-bold text-[#F8F2E8] tracking-tight leading-tight">
            {dish.name}
          </h2>

          {/* Culinary Specs Tags */}
          <div className="flex items-center gap-1.5 text-[9.5px] font-medium overflow-x-auto no-scrollbar pt-1">
            {culinarySpecs.map((spec, i) => {
              const Icon = spec.icon;
              return (
                <span
                  key={i}
                  className="shrink-0 bg-black/60 border border-[#F0C36B]/25 rounded-md px-1.5 py-0.5 leading-none flex items-center gap-1 text-[#F0C36B]"
                >
                  <Icon className="w-2.5 h-2.5 text-[#F0C36B]" />
                  <span className="text-[#F8F2E8] text-[9px]">{spec.label}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Editorial Description */}
        {dish.description && (
          <p className="text-[11px] sm:text-xs text-[#D4C7B6] font-normal leading-relaxed line-clamp-2">
            {dish.description}
          </p>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ZONE 2 (Bottom Box): Ingredients, Sommelier, AR & Price/Order Console      */}
      {/* ========================================================================= */}
      <div className="rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 bg-[rgba(16,12,9,0.90)] backdrop-blur-2xl border border-[#F0C36B]/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_16px_40px_rgba(0,0,0,0.85)] flex flex-col gap-2">
        {/* Artisanal Ingredients */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] uppercase tracking-wider text-[#D4C7B6] font-bold font-mono">
              ARTISANAL INGREDIENTS
            </span>
            <button
              type="button"
              onClick={onViewDetails}
              className="text-[9.5px] text-[#F0C36B] hover:text-[#FFE3A5] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Info className="w-2.5 h-2.5" />
              <span>Full Details</span>
            </button>
          </div>

          {/* Ingredients Chips Wrap */}
          <div className="flex flex-wrap gap-1">
            {displayIngredients.slice(0, 4).map((ing, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-[9.5px] text-[#FAF5EC]/90 font-medium"
              >
                {ing}
              </span>
            ))}
          </div>
        </div>

        {/* Sommelier Pairing Recommendation */}
        <div className="pt-1.5 border-t border-white/[0.08]">
          <span className="text-[8.5px] uppercase tracking-wider text-[#D4C7B6] font-bold font-mono block mb-0.5">
            SOMMELIER RECOMMENDATION
          </span>
          <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11.5px] text-[#F0C36B]/90 font-serif italic">
            <Wine className="w-3 h-3 text-[#F0C36B] shrink-0" />
            <span className="truncate">Pairs harmoniously with Italian Barolo or Pinot Noir.</span>
          </div>
        </div>

        {/* View in AR Button */}
        <Link
          href={`/ar/${dish.slug || dish.id}`}
          className="relative group w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-[rgba(240,195,107,0.18)] via-[rgba(240,195,107,0.30)] to-[rgba(240,195,107,0.18)] hover:from-[rgba(240,195,107,0.30)] hover:to-[rgba(240,195,107,0.45)] border border-[#F0C36B]/80 hover:border-[#F0C36B] text-[#FFE3A5] hover:text-white transition-all shadow-[0_4px_16px_rgba(0,0,0,0.5),0_0_15px_rgba(240,195,107,0.25)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.6),0_0_25px_rgba(240,195,107,0.45)] active:scale-98 cursor-pointer backdrop-blur-md"
          title="Place on My Table in Augmented Reality"
        >
          <Box className="w-3.5 h-3.5 text-[#F0C36B] group-hover:scale-110 transition-transform shrink-0" />
          <span className="text-xs sm:text-[12.5px] font-bold tracking-wide whitespace-nowrap">
            View in AR · Place on Table
          </span>
          <Sparkles className="w-3 h-3 text-[#F0C36B] group-hover:rotate-12 transition-transform shrink-0" />
        </Link>

        {/* Integrated Price Stack, Quantity Stepper, and Add to Order CTA */}
        <div className="pt-1.5 border-t border-[#F0C36B]/30 flex items-center justify-between gap-2">
          {/* Price Stack */}
          <div className="flex flex-col items-start shrink-0">
            <span className="text-[8px] uppercase tracking-widest text-[#D4C7B6] font-bold font-mono">
              TOTAL PRICE
            </span>
            <span className="font-mono text-base sm:text-lg font-bold text-[#F8F2E8] leading-tight">
              ₹{grandTotal}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Stepper [ - 1 + ] */}
            <div className="flex items-center bg-black/60 border border-[#F0C36B]/35 rounded-full p-0.5 sm:p-1">
              <button
                type="button"
                onClick={handleMinus}
                disabled={quantity <= 1}
                className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[#F0C36B] hover:bg-[#F0C36B]/15 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </button>
              <span className="w-4 sm:w-5 text-center font-mono text-[11px] sm:text-xs font-bold text-[#F8F2E8]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handlePlus}
                disabled={quantity >= 20}
                className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[#F0C36B] hover:bg-[#F0C36B]/15 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </button>
            </div>

            {/* Primary Add to Order CTA Button */}
            {added ? (
              <div className="rounded-xl px-3 sm:px-3.5 py-1.5 sm:py-2 bg-[#0A261C] border border-[#36D6A0]/50 text-[#36D6A0] font-bold text-xs sm:text-[13px] flex items-center gap-1.5 shadow-[0_0_20px_rgba(54,214,160,0.3)] animate-in zoom-in-95 duration-200">
                <Check className="w-3.5 h-3.5 text-[#36D6A0]" />
                <span>Added</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                className="relative group rounded-xl px-3 sm:px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-[#F0C36B] to-[#D4A346] text-[#120E0B] font-bold text-xs sm:text-[13px] flex items-center gap-1.5 shadow-[0_2px_14px_rgba(240,195,107,0.4)] hover:shadow-[0_4px_20px_rgba(240,195,107,0.6)] active:scale-97 transition-all cursor-pointer border border-[#FFE3A5]/40"
              >
                <span>Add to Order</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
