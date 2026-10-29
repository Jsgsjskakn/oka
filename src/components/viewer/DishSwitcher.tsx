'use client';

import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Check, Sparkles } from 'lucide-react';

export interface DishSwitcherItem {
  id: string;
  name: string;
  image: string;
  price?: number;
  category?: string;
  isVeg?: boolean;
}

export interface DishSwitcherProps {
  dishes: DishSwitcherItem[];
  currentDishId: string;
  currentCategory?: string;
  onSwitchDish: (dishId: string) => void;
}

const CATEGORY_LABEL_MAP: Record<string, string> = {
  pizza: 'Pizzas',
  pizzas: 'Pizzas',
  burger: 'Burgers',
  burgers: 'Burgers',
  chinese: 'Chinese',
  starters: 'Starters',
  starter: 'Starters',
  desserts: 'Desserts',
  dessert: 'Desserts',
  beverages: 'Drinks',
  drinks: 'Drinks',
  menu: 'Chef Specials',
};

function getCategoryEmoji(slug: string): string {
  const s = slug.toLowerCase();
  if (s.includes('pizza')) return '🍕';
  if (s.includes('burger')) return '🍔';
  if (s.includes('chinese')) return '🥢';
  if (s.includes('starter')) return '🍟';
  if (s.includes('dessert')) return '🍰';
  if (s.includes('drink') || s.includes('beverage')) return '🍷';
  return '🍽️';
}

export function DishSwitcher({
  dishes,
  currentDishId,
  currentCategory,
  onSwitchDish,
}: DishSwitcherProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dropdown open/close state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Active dish object
  const activeDish = useMemo(() => {
    return dishes.find((d) => d.id === currentDishId) || dishes[0];
  }, [dishes, currentDishId]);

  // Derived category list with counts
  const categories = useMemo(() => {
    const catMap = new Map<string, { label: string; count: number }>();

    dishes.forEach((d) => {
      const rawKey = (d.category || 'menu').toLowerCase();
      const existing = catMap.get(rawKey);
      if (existing) {
        existing.count += 1;
      } else {
        const label = CATEGORY_LABEL_MAP[rawKey] || (rawKey.charAt(0).toUpperCase() + rawKey.slice(1));
        catMap.set(rawKey, { label, count: 1 });
      }
    });

    return Array.from(catMap.entries()).map(([slug, val]) => ({
      slug,
      label: val.label,
      count: val.count,
    }));
  }, [dishes]);

  // Active category filter: defaults to the active dish's category
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    return (activeDish?.category || currentCategory || 'pizza').toLowerCase();
  });

  // When active dish changes from outside, sync category if needed
  useEffect(() => {
    if (activeDish?.category && selectedCategory !== 'all') {
      const dishCat = activeDish.category.toLowerCase();
      if (dishCat !== selectedCategory) {
        setSelectedCategory(dishCat);
      }
    }
  }, [activeDish, selectedCategory]);

  // Click-outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  // Filtered dishes based on category selection
  const filteredDishes = useMemo(() => {
    if (selectedCategory === 'all') {
      return dishes;
    }
    const matching = dishes.filter(
      (d) => (d.category || '').toLowerCase() === selectedCategory.toLowerCase()
    );
    return matching.length > 0 ? matching : dishes;
  }, [dishes, selectedCategory]);

  // Display label and count for the single category button
  const currentCategoryInfo = useMemo(() => {
    if (selectedCategory === 'all') {
      return {
        label: 'All Dishes',
        count: dishes.length,
        emoji: '✦',
      };
    }
    const match = categories.find((c) => c.slug === selectedCategory);
    if (match) {
      return {
        label: match.label,
        count: match.count,
        emoji: getCategoryEmoji(match.slug),
      };
    }
    const fallbackLabel =
      CATEGORY_LABEL_MAP[selectedCategory] ||
      selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
    return {
      label: fallbackLabel,
      count: dishes.filter((d) => (d.category || '').toLowerCase() === selectedCategory).length,
      emoji: getCategoryEmoji(selectedCategory),
    };
  }, [selectedCategory, categories, dishes]);

  // Select a category from dropdown
  const handleSelectCategory = (catSlug: string) => {
    setSelectedCategory(catSlug);
    setIsDropdownOpen(false);

    // If active dish is not in the newly selected category, switch to the first dish of that category
    if (catSlug !== 'all') {
      const firstDishInCat = dishes.find((d) => (d.category || '').toLowerCase() === catSlug);
      if (firstDishInCat && firstDishInCat.id !== currentDishId) {
        onSwitchDish(firstDishInCat.id);
      }
    }

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Scroll controls for dish filmstrip
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Auto-scroll active dish into view
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeEl = scrollRef.current.querySelector<HTMLElement>(
      `[data-dish-id="${currentDishId}"]`
    );
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentDishId, selectedCategory]);

  const handleDishClick = useCallback(
    (dishId: string) => {
      onSwitchDish(dishId);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(12);
      }
    },
    [onSwitchDish]
  );

  return (
    <div
      className="fixed bottom-3 sm:bottom-3.5 left-1/2 -translate-x-1/2 lg:left-[calc((100vw-420px)/2)] lg:-translate-x-1/2 z-35 pointer-events-auto select-none w-[calc(100vw-24px)] max-w-[96vw] lg:max-w-4xl xl:max-w-5xl transition-all duration-300"
      aria-label="Interactive Dish & Category Dock"
    >
      {/* Luxury Glass Dock */}
      <div className="relative flex items-center gap-2.5 p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl bg-[rgba(14,10,8,0.92)] backdrop-blur-2xl border border-[#F0C36B]/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_12px_42px_rgba(0,0,0,0.88)]">
        
        {/* ========================================================================= */}
        {/* SECTION 1: Single Category Button with Direct Dropdown Selector           */}
        {/* (Directly matching user's yellow scribble request)                        */}
        {/* ========================================================================= */}
        <div ref={dropdownRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
            className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#F0C36B] to-[#D4A346] text-[#120E0B] font-serif font-bold text-xs sm:text-[13px] shadow-[0_2px_14px_rgba(240,195,107,0.45)] hover:shadow-[0_4px_18px_rgba(240,195,107,0.6)] active:scale-97 transition-all cursor-pointer border border-[#FFE3A5]/40"
            title="Click to change food category"
          >
            <span className="text-sm select-none">{currentCategoryInfo.emoji}</span>
            <span className="tracking-tight">{currentCategoryInfo.label}</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#120E0B]/20 text-[#120E0B]">
              {currentCategoryInfo.count}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#120E0B] transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* ======================================================================= */}
          {/* Direct Category Dropdown Menu ("sidha option dikhega select karne ka")  */}
          {/* ======================================================================= */}
          {isDropdownOpen && (
            <div
              role="listbox"
              aria-label="Food Categories"
              className="absolute bottom-full mb-3 left-0 w-56 sm:w-64 rounded-2xl bg-[rgba(18,14,11,0.96)] backdrop-blur-2xl border border-[#F0C36B]/50 shadow-[0_20px_50px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.18)] p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-[#F0C36B]/70 font-semibold border-b border-white/[0.08] mb-1 flex items-center justify-between">
                <span>Select Category</span>
                <Sparkles className="w-2.5 h-2.5 text-[#F0C36B]" />
              </div>

              {/* All Dishes Option */}
              <button
                type="button"
                role="option"
                aria-selected={selectedCategory === 'all'}
                onClick={() => handleSelectCategory('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-serif font-bold transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#F0C36B]/20 text-[#FFE3A5] border border-[#F0C36B]/40'
                    : 'text-[#D8CFBE] hover:text-white hover:bg-white/[0.07]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>✦</span>
                  <span>All Dishes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-[#F0C36B]">
                    {dishes.length}
                  </span>
                  {selectedCategory === 'all' && (
                    <Check className="w-3.5 h-3.5 text-[#F0C36B]" />
                  )}
                </div>
              </button>

              {/* Specific Category Options */}
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.slug;
                const emoji = getCategoryEmoji(cat.slug);
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectCategory(cat.slug)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-serif font-bold transition-all cursor-pointer mt-0.5 ${
                      isSelected
                        ? 'bg-[#F0C36B]/20 text-[#FFE3A5] border border-[#F0C36B]/40'
                        : 'text-[#D8CFBE] hover:text-white hover:bg-white/[0.07]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{emoji}</span>
                      <span>{cat.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-[#F0C36B]">
                        {cat.count}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#F0C36B]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Vertical Gold Divider between Category Button & Dishes */}
        <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-[#F0C36B]/50 to-transparent shrink-0" />

        {/* ========================================================================= */}
        {/* SECTION 2: Prominent Tactile Mouse-Interactive Dish Cards                 */}
        {/* ========================================================================= */}
        <div className="relative flex-1 flex items-center min-w-0">
          {/* Left Scroll Chevron */}
          <button
            type="button"
            onClick={() => scroll('left')}
            className="hidden sm:flex w-7 h-7 rounded-lg items-center justify-center bg-white/[0.04] hover:bg-[#F0C36B]/20 text-[#F0C36B] border border-white/10 hover:border-[#F0C36B]/50 active:scale-90 transition-all shrink-0 cursor-pointer mr-1.5"
            aria-label="Previous dishes"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable Filmstrip of Large, Tactile Mouse-Interactive Dish Cards */}
          <div
            ref={scrollRef}
            className="overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-2.5 py-1 px-0.5 flex-1 overflow-y-visible"
          >
            {filteredDishes.map((dishItem) => {
              const isActive = dishItem.id === currentDishId;

              return (
                <button
                  key={dishItem.id}
                  data-dish-id={dishItem.id}
                  type="button"
                  onClick={() => handleDishClick(dishItem.id)}
                  className={`group relative flex items-center gap-2.5 p-1.5 pr-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 shrink-0 select-none ${
                    isActive
                      ? 'bg-gradient-to-r from-[#F0C36B]/25 via-[#231A13] to-[#18130F] border-[#F0C36B] shadow-[0_0_24px_rgba(240,195,107,0.45),inset_0_1px_1px_rgba(255,255,255,0.22)] ring-1 ring-[#F0C36B]/40'
                      : 'bg-[#18130F]/90 hover:bg-[#241C16] border-white/10 hover:border-[#F0C36B]/60 shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.7)] hover:-translate-y-1'
                  }`}
                  title={`Select ${dishItem.name}`}
                >
                  {/* High-Resolution Close-Up Dish Thumbnail */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden shrink-0 bg-[#0C0907] border border-white/15">
                    <img
                      src={dishItem.image}
                      alt={dishItem.name}
                      className="w-full h-full object-cover scale-105 group-hover:scale-120 transition-transform duration-300 pointer-events-none"
                      loading="lazy"
                    />
                    {/* Veg / Non-Veg Indicator Dot */}
                    <div className="absolute top-1 left-1 w-3.5 h-3.5 rounded bg-[#120E0B]/90 border border-white/20 flex items-center justify-center pointer-events-none">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          dishItem.isVeg ? 'bg-emerald-400' : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Dish Name & Price for Easy Mouse Selection */}
                  <div className="flex flex-col min-w-[95px] max-w-[130px] sm:max-w-[160px]">
                    <span className="text-[12px] sm:text-[13px] font-serif font-bold text-[#FAF5EC] truncate group-hover:text-[#F0C36B] transition-colors leading-tight">
                      {dishItem.name}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-mono font-bold text-[#F0C36B]">
                        ₹{Math.round(dishItem.price || 0)}
                      </span>
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold text-[#F0C36B] bg-[#F0C36B]/15 px-1.5 py-0.2 rounded border border-[#F0C36B]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F0C36B] animate-pulse" />
                          Viewing
                        </span>
                      ) : (
                        <span className="text-[9px] text-[#A69B8D] uppercase tracking-wider group-hover:text-[#E0D8CC]">
                          Select
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Scroll Chevron */}
          <button
            type="button"
            onClick={() => scroll('right')}
            className="hidden sm:flex w-7 h-7 rounded-lg items-center justify-center bg-white/[0.04] hover:bg-[#F0C36B]/20 text-[#F0C36B] border border-white/10 hover:border-[#F0C36B]/50 active:scale-90 transition-all shrink-0 cursor-pointer ml-1.5"
            aria-label="Next dishes"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
