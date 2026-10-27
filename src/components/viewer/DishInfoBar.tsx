'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Minus,
  Plus,
  Check,
  ShoppingCart,
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
      className="fixed bottom-3 right-3 sm:right-6 lg:right-6 xl:right-8 top-auto lg:top-[152px] lg:bottom-4 xl:bottom-5 w-[calc(100vw-24px)] sm:w-[360px] lg:w-[370px] xl:w-[390px] z-40 pointer-events-auto select-none flex flex-col animate-in fade-in slide-in-from-right-4 duration-300"
      aria-label="Dish Dossier & Order Console"
    >
      {/* Tall Extended Luxury Glass Box Console - Matches Red Marking Exactly */}
      <div className="h-full flex flex-col justify-between rounded-3xl p-4 sm:p-5 lg:p-5.5 bg-[rgba(16,12,9,0.78)] backdrop-blur-2xl border border-[#F0C36B]/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.22),0_24px_60px_rgba(0,0,0,0.88)] overflow-hidden">
        {/* Top Scrollable Dossier Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3.5 pr-0.5">
          {/* Header Row: Thumbnail + Titles */}
          <div
            className="flex items-start gap-3 cursor-pointer group"
            onClick={onViewDetails}
          >
            {/* Rounded Dish Photo */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-[#F0C36B]/50 shrink-0 shadow-lg bg-[#16120E] group-hover:border-[#F0C36B] transition-all">
              <img
                src={dish.image || '/images/dishes/placeholder.jpg'}
                alt={dish.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Title & Category Row */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    dish.isVeg ? 'bg-emerald-400' : 'bg-red-500'
                  }`}
                  title={dish.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                />
                <h2 className="font-serif text-base sm:text-lg font-bold text-[#F8F2E8] tracking-tight leading-tight group-hover:text-[#F0C36B] transition-colors truncate">
                  {dish.name}
                </h2>
                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0C36B]/15 border border-[#F0C36B]/40 text-[#FFE3A5] text-[9.5px] font-semibold font-mono">
                  <Sparkles className="w-2.5 h-2.5 text-[#F0C36B]" />
                  <span>Premium</span>
                </span>
              </div>

              {/* Culinary Specs Tags */}
              <div className="flex items-center gap-1.5 text-[10px] font-medium overflow-x-auto no-scrollbar py-0.5">
                {culinarySpecs.map((spec, i) => {
                  const Icon = spec.icon;
                  return (
                    <span
                      key={i}
                      className="shrink-0 bg-black/60 border border-[#F0C36B]/25 rounded-md px-2 py-0.5 leading-none flex items-center gap-1 text-[#F0C36B]"
                    >
                      <Icon className="w-2.5 h-2.5 text-[#F0C36B]" />
                      <span className="text-[#F8F2E8] text-[9.5px]">{spec.label}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Description */}
          {dish.description && (
            <p className="text-xs text-[#D4C7B6]/90 font-light leading-relaxed pt-0.5">
              {dish.description}
            </p>
          )}

          {/* Curated Ingredients & Flavor Dossier (Fills the extended height beautifully) */}
          <div className="pt-2 border-t border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[#A99A88] font-bold font-mono">
                ARTISANAL INGREDIENTS
              </span>
              <button
                type="button"
                onClick={onViewDetails}
                className="text-[10px] text-[#F0C36B] hover:text-[#FFE3A5] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Info className="w-2.5 h-2.5" />
                <span>Full Details</span>
              </button>
            </div>

            {/* Ingredients Chips Wrap */}
            <div className="flex flex-wrap gap-1.5">
              {displayIngredients.slice(0, 6).map((ing, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/10 text-[10.5px] text-[#FAF5EC]/90 font-medium"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>

          {/* Sommelier & Flavor Notes */}
          <div className="pt-2 border-t border-white/[0.08] space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#A99A88] font-bold font-mono block">
              SOMMELIER RECOMMENDATION
            </span>
            <div className="flex items-center gap-2 text-xs text-[#F0C36B]/90 font-serif italic">
              <Wine className="w-3.5 h-3.5 text-[#F0C36B] shrink-0" />
              <span>Pairs harmoniously with Italian Barolo or Reserve Pinot Noir.</span>
            </div>
          </div>

          {/* View in AR Full-Width Button */}
          <Link
            href={`/ar/${dish.slug || dish.id}`}
            className="relative group w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/[0.05] hover:bg-[#F0C36B]/20 border border-[#F0C36B]/50 hover:border-[#F0C36B] text-[#F8F2E8] hover:text-[#FFE1A0] transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.18),0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.28),0_0_20px_rgba(240,195,107,0.35)] active:scale-95 cursor-pointer backdrop-blur-xl mt-1"
            title="Place on My Table in Augmented Reality"
          >
            <Box className="w-4 h-4 text-[#F0C36B] group-hover:scale-110 transition-transform shrink-0" />
            <span className="text-xs sm:text-[13px] font-bold tracking-wide whitespace-nowrap">
              View in AR · Place on Table
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#F0C36B] group-hover:rotate-12 transition-transform shrink-0" />
          </Link>
        </div>

        {/* Bottom Order Console Bar Pinned to the Bottom of the Tall Box */}
        <div className="pt-3.5 mt-3 border-t border-white/[0.09] flex items-center justify-between gap-2.5">
          {/* Price Stack */}
          <div className="flex flex-col items-start shrink-0">
            <span className="text-[9px] uppercase tracking-widest text-[#A99A88] font-bold font-mono">
              TOTAL PRICE
            </span>
            <span className="font-mono text-lg sm:text-xl font-bold text-[#F8F2E8] leading-tight">
              ₹{grandTotal}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Stepper [ - 1 + ] */}
            <div className="flex items-center bg-black/60 border border-[#F0C36B]/35 rounded-full p-0.5 sm:p-1">
              <button
                type="button"
                onClick={handleMinus}
                disabled={quantity <= 1}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[#F0C36B] hover:bg-[#F0C36B]/15 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-5 sm:w-6 text-center font-mono text-xs font-bold text-[#F8F2E8]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handlePlus}
                disabled={quantity >= 20}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[#F0C36B] hover:bg-[#F0C36B]/15 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Primary Add to Order CTA Button */}
            {added ? (
              <div className="rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#0A261C] border border-[#36D6A0]/50 text-[#36D6A0] font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_20px_rgba(54,214,160,0.3)] animate-in zoom-in-95 duration-200">
                <Check className="w-3.5 h-3.5 text-[#36D6A0]" />
                <span>Added</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                className="relative overflow-hidden group rounded-xl px-4 py-2 sm:py-2.5 font-bold text-[#17100C] text-xs sm:text-sm tracking-wide transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(240,195,107,0.45)] active:translate-y-0 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-lg shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #F0C36B 0%, #DDA33E 50%, #A8792A 100%)',
                }}
              >
                <ShoppingCart className="w-3.5 h-3.5 text-[#17100C]" />
                <span className="whitespace-nowrap">Add to Order →</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
