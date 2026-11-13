'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ShoppingCart,
  ChevronRight,
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
  const dishKey = dish.slug || dish.id;
  const [stepperState, setStepperState] = useState<{ key: string; quantity: number }>({
    key: dishKey,
    quantity: 1,
  });
  const [addedForKey, setAddedForKey] = useState<string | null>(null);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const quantity = stepperState.key === dishKey ? stepperState.quantity : 1;
  const added = addedForKey === dishKey;

  // Clean up Added feedback timer on dish switch or unmount
  useEffect(() => {
    return () => {
      if (addedTimerRef.current) {
        clearTimeout(addedTimerRef.current);
        addedTimerRef.current = null;
      }
    };
  }, [dishKey]);

  const baseUnitPrice = dish.price || 0;
  const grandTotal = Math.round(baseUnitPrice * quantity);

  const handleMinus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > 1) {
      setStepperState((prev) => ({
        key: dishKey,
        quantity: Math.max(1, (prev.key === dishKey ? prev.quantity : 1) - 1),
      }));
      if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(8);
    }
  };

  const handlePlus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity < 20) {
      setStepperState((prev) => ({
        key: dishKey,
        quantity: Math.min(20, (prev.key === dishKey ? prev.quantity : 1) + 1),
      }));
      if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(8);
    }
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(quantity, []);
    setAddedForKey(dishKey);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(20);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    addedTimerRef.current = setTimeout(() => setAddedForKey(null), 2200);
  };

  // Determine authentic culinary specs by dish type
  const getCulinarySpecs = () => {
    const slug = (dish.slug || '').toLowerCase();
    const cat = ((dish.category as string) || '').toLowerCase();
    const prepLabel = dish.preparationTime || '15 Mins Prep';
    if (slug.includes('pizza') || cat.includes('pizza')) {
      return [
        { label: 'Wood-Fired', icon: Flame },
        { label: '12" Artisan Crust', icon: Ruler },
        { label: prepLabel, icon: Clock },
      ];
    }
    if (slug.includes('burger') || cat.includes('burger')) {
      return [
        { label: 'Charcoal Grilled', icon: Flame },
        { label: 'Toasted Brioche', icon: Sparkles },
        { label: dish.preparationTime || '12 Mins Prep', icon: Clock },
      ];
    }
    if (slug.includes('mocktail') || cat.includes('drink') || cat.includes('beverage')) {
      return [
        { label: 'Hand-Muddled', icon: Sparkles },
        { label: 'Botanical Infusion', icon: Leaf },
        { label: dish.preparationTime || '5 Mins Prep', icon: Clock },
      ];
    }
    if (cat.includes('dessert')) {
      return [
        { label: 'Pastry Craft', icon: Sparkles },
        { label: 'Artisan Plating', icon: Leaf },
        { label: dish.preparationTime || '10 Mins Prep', icon: Clock },
      ];
    }
    return [
      { label: 'Chef Crafted', icon: Flame },
      { label: 'Farm Fresh Herbs', icon: Leaf },
      { label: dish.preparationTime || '12 Mins Prep', icon: Clock },
    ];
  };

  const culinarySpecs = getCulinarySpecs();

  // Curated ingredients fallback if not provided
  const slugLower = (dish.slug || '').toLowerCase();
  const catLower = ((dish.category as string) || '').toLowerCase();
  const displayIngredients =
    dish.ingredients && dish.ingredients.length > 0
      ? dish.ingredients
      : slugLower.includes('pizza')
      ? ['Black Truffle Oil', 'Wild Porcini', 'Aged Parmesan', 'Fresh Thyme', 'Buffalo Mozzarella', 'Fermented Sourdough']
      : slugLower.includes('mocktail') || catLower.includes('drink') || catLower.includes('beverage')
      ? ['Kaffir Lime Leaf', 'Cold-Pressed Citrus', 'Botanical Tonic', 'Crushed Ice']
      : slugLower.includes('chow') || slugLower.includes('wok') || slugLower.includes('dim-sum') || catLower.includes('chinese')
      ? ['Artisan Noodles', 'Roasted Sesame Oil', 'Crisp Pok Choy', 'Aged Soy Glaze', 'Spring Scallions']
      : ['Artisan Brioche', 'Aged Cheddar', 'Crisp Butterhead', 'Smoked Glaze', 'Organic Microgreens'];

  return (
    <>
      {/* ========================================================================= */}
      {/* DESKTOP VIEW (sm:flex): Original 2-Zone Extended Luxury Glass Box         */}
      {/* ========================================================================= */}
      <aside
        className="hidden sm:flex fixed bottom-3 sm:bottom-3.5 lg:bottom-4 xl:bottom-5 right-3 sm:right-4 lg:right-6 xl:right-8 top-auto sm:w-[308px] md:w-[328px] lg:w-[350px] xl:w-[370px] z-40 pointer-events-auto select-none flex-col gap-2 sm:gap-2.5 animate-in fade-in slide-in-from-right-4 duration-300 max-h-[calc(100dvh-92px)] overflow-y-auto hide-scrollbar"
        aria-label="Dish Dossier & Order Console"
      >
        {/* ZONE 1 (Top Box): High-Resolution Dish Photography, Name & Description */}
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

            <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
              <span
                className={`w-2.5 h-2.5 rounded-full shadow-md ${
                  dish.isVeg ? 'bg-emerald-400 shadow-[0_0_8px_#34D399]' : 'bg-red-500 shadow-[0_0_8px_#EF4444]'
                }`}
                title={dish.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
              />
              <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[#FFE3A5] border border-[#F0C36B]/30 font-semibold">
                {dish.category || 'Specialty'}
              </span>
            </div>

            <div className="absolute bottom-2 left-2.5 right-2.5 z-10">
              <h2 className="font-serif text-sm sm:text-base font-bold text-[#F8F2E8] tracking-tight leading-tight group-hover:text-[#F0C36B] transition-colors truncate drop-shadow-md">
                {dish.name}
              </h2>
            </div>
          </div>

          {/* Description */}
          <p className="text-[11px] sm:text-xs text-[#D4C7B6] font-light leading-relaxed line-clamp-2 px-0.5">
            {dish.description || 'Artisan handcrafted culinary masterpiece curated with rare, farm-sourced ingredients.'}
          </p>

          {/* Culinary Specs Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
            {culinarySpecs.map((spec, i) => {
              const Icon = spec.icon;
              return (
                <span
                  key={i}
                  className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 border border-white/[0.08] text-[#D4C7B6] text-[9.5px] font-medium"
                >
                  <Icon className="w-2.5 h-2.5 text-[#F0C36B]" />
                  <span>{spec.label}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* ZONE 2 (Bottom Box): Ingredients, Sommelier, AR & Price/Order Console */}
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
                <span>View All ({displayIngredients.length})</span>
                <span>→</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {displayIngredients.slice(0, 4).map((ing, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[#F8F2E8] text-[9.5px]"
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
            className="relative group w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-[rgba(240,195,107,0.18)] via-[rgba(240,195,107,0.30)] to-[rgba(240,195,107,0.18)] hover:from-[rgba(240,195,107,0.30)] hover:to-[rgba(240,195,107,0.45)] border border-[#F0C36B]/80 hover:border-[#F0C36B] text-[#FFE3A5] hover:text-white transition-all shadow-[0_4px_16px_rgba(0,0,0,0.5),0_0_15px_rgba(240,195,107,0.25)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.6),0_0_25px_rgba(240,195,107,0.45)] active:scale-[0.98] cursor-pointer backdrop-blur-md"
            title="Place on My Table in Augmented Reality"
          >
            <Box className="w-3.5 h-3.5 text-[#F0C36B] group-hover:scale-110 transition-transform shrink-0" />
            <span className="text-xs sm:text-[12.5px] font-bold tracking-wide whitespace-nowrap">
              View in AR · Place on Table
            </span>
            <Sparkles className="w-3 h-3 text-[#F0C36B] group-hover:rotate-12 transition-transform shrink-0" />
          </Link>

          {/* Price Stack & Add CTA */}
          <div className="pt-1.5 border-t border-[#F0C36B]/30 flex items-center justify-between gap-2">
            <div className="flex flex-col items-start shrink-0">
              <span className="text-[8px] uppercase tracking-widest text-[#D4C7B6] font-bold font-mono">
                TOTAL PRICE
              </span>
              <span className="font-mono text-base sm:text-lg font-bold text-[#F8F2E8] leading-tight">
                ₹{grandTotal}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center bg-black/60 border border-[#F0C36B]/35 rounded-full p-0.5 sm:p-1">
                <button
                  type="button"
                  onClick={handleMinus}
                  disabled={quantity <= 1}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[#F0C36B] hover:bg-[#F0C36B]/15 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
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
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[#F0C36B] hover:bg-[#F0C36B]/15 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </button>
              </div>

              {added ? (
                <div className="rounded-xl px-3 sm:px-3.5 py-1.5 sm:py-2 bg-[#0A261C] border border-[#36D6A0]/50 text-[#36D6A0] font-bold text-xs sm:text-[13px] flex items-center gap-1.5 shadow-[0_0_20px_rgba(54,214,160,0.3)] animate-in zoom-in-95 duration-200">
                  <Check className="w-3.5 h-3.5 text-[#36D6A0]" />
                  <span>Added</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAdd}
                  className="relative group rounded-xl px-3 sm:px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-[#F0C36B] to-[#D4A346] text-[#120E0B] font-bold text-xs sm:text-[13px] flex items-center gap-1.5 shadow-[0_2px_14px_rgba(240,195,107,0.4)] hover:shadow-[0_4px_20px_rgba(240,195,107,0.6)] active:scale-[0.97] transition-all cursor-pointer border border-[#FFE3A5]/40"
                >
                  <span>Add to Order</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE VIEW (sm:hidden): Compact Bottom Console for Phones                */}
      {/* ========================================================================= */}
      <aside
        className="flex sm:hidden fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-3 right-3 mx-auto max-w-[380px] z-40 pointer-events-auto select-none flex-col animate-in fade-in slide-in-from-bottom-2 duration-300"
        aria-label="Dish Order Console"
      >
        <div className="rounded-2xl py-2 px-3 bg-[rgba(16,12,9,0.92)] backdrop-blur-2xl border border-[#F0C36B]/40 shadow-[0_10px_28px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col gap-1.5">
          {/* Row 1: Veg Dot, Dish Name, Category Tag, Details Trigger & Price */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onViewDetails}
              className="flex items-center gap-1.5 min-w-0 flex-1 min-h-[44px] text-left cursor-pointer group touch-manipulation"
              title="Tap to inspect full ingredients"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  dish.isVeg ? 'bg-emerald-400' : 'bg-red-500'
                }`}
              />
              <h2 className="font-serif text-xs font-bold text-[#F8F2E8] group-hover:text-[#F0C36B] truncate">
                {dish.name}
              </h2>
              {dish.category && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-[#FFE3A5] border border-[#F0C36B]/30 shrink-0 max-w-[96px] truncate">
                  {dish.category}
                </span>
              )}
              {onViewDetails && (
                <ChevronRight className="w-3 h-3 text-[#F0C36B]/70 shrink-0" />
              )}
            </button>
            <span className="font-mono text-xs font-bold text-[#F0C36B] shrink-0">
              ₹{grandTotal}
            </span>
          </div>

          {/* Row 2: Quantity Stepper & Add to Cart Button */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.08]">
            <div className="flex items-center bg-black/60 border border-[#F0C36B]/35 rounded-full p-0.5">
              <button
                type="button"
                onClick={handleMinus}
                disabled={quantity <= 1}
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-[#F0C36B] hover:bg-[#F0C36B]/15 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer touch-manipulation before:content-[''] before:absolute before:-inset-2.5"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-5 text-center font-mono text-[11px] font-bold text-[#F8F2E8]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handlePlus}
                disabled={quantity >= 20}
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-[#F0C36B] hover:bg-[#F0C36B]/15 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer touch-manipulation before:content-[''] before:absolute before:-inset-2.5"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {added ? (
              <div className="min-h-[44px] rounded-xl px-4 py-2 bg-[#0A261C] border border-[#36D6A0]/50 text-[#36D6A0] font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(54,214,160,0.3)]">
                <Check className="w-3.5 h-3.5 text-[#36D6A0]" />
                <span>Added to Bag</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                className="min-h-[44px] rounded-xl px-4 py-2 bg-gradient-to-r from-[#F0C36B] to-[#D4A346] text-[#120E0B] font-bold text-xs flex items-center gap-1.5 shadow-[0_2px_12px_rgba(240,195,107,0.35)] hover:shadow-[0_4px_16px_rgba(240,195,107,0.5)] active:scale-95 transition-all cursor-pointer border border-[#FFE3A5]/40 touch-manipulation"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-[#120E0B]" />
                <span className="whitespace-nowrap font-bold">Add to Order</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
