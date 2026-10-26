'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Plus, Box, Sparkles, Flame, Check } from 'lucide-react';
import { useSpotlightStore } from '@/store/spotlight-store';
import { useCartStore } from '@/store/cart-store';
import { toast } from '@/store/toast-store';
import { resolveDishImageUrl } from '@/lib/utils/dish-images';
import type { Dish } from '@/types/menu';

interface SpotlightDish {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isVeg: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  spiceLevel?: string;
  tags?: string[];
}

export const SPOTLIGHT_CATALOG: SpotlightDish[] = [
  {
    id: 'tandoori-paneer-pizza',
    slug: 'tandoori-paneer-pizza',
    name: 'Tandoori Paneer Pizza',
    description:
      'Charcoal-grilled cottage cheese marinated in aromatic spices, topped with bell peppers, crisp red onions, and fresh coriander on our signature stone-baked crust.',
    price: 449,
    image: resolveDishImageUrl('tandoori-paneer-pizza'),
    category: 'pizza',
    isVeg: true,
    isFeatured: true,
    isBestSeller: true,
    tags: ['paneer', 'pizza', 'wood-fired', 'tandoori'],
  },
  {
    id: 'chicken-tikka-pizza',
    slug: 'chicken-tikka-pizza',
    name: 'Chicken Tikka Pizza',
    description:
      'Tandoor-smoked chicken tikka with pickled onions, aged cheddar, and smoky mint chutney drizzle on stone-baked crust.',
    price: 499,
    image: resolveDishImageUrl('chicken-tikka-pizza'),
    category: 'pizza',
    isVeg: false,
    isFeatured: true,
    isBestSeller: true,
    tags: ['chicken', 'tikka', 'pizza', 'wood-fired'],
  },
  {
    id: 'mushroom-truffle-pizza',
    slug: 'mushroom-truffle-pizza',
    name: 'Mushroom Truffle Pizza',
    description:
      'Wild mushroom medley with black truffle oil, aged parmesan, fresh thyme, and buffalo mozzarella on sourdough crust.',
    price: 549,
    image: resolveDishImageUrl('mushroom-truffle-pizza'),
    category: 'pizza',
    isVeg: true,
    isFeatured: true,
    isBestSeller: false,
    tags: ['mushroom', 'truffle', 'pizza', 'wood-fired'],
  },
  {
    id: 'peri-peri-fiesta-pizza',
    slug: 'peri-peri-fiesta-pizza',
    name: 'Peri Peri Fiesta Pizza',
    description:
      'Spicy peri peri sauce base with roasted capsicum, corn, black olives, and a fresh herb drizzle on crispy crust.',
    price: 429,
    image: resolveDishImageUrl('peri-peri-fiesta-pizza'),
    category: 'pizza',
    isVeg: true,
    isFeatured: false,
    isBestSeller: false,
    spiceLevel: 'spicy',
    tags: ['spicy', 'fiery', 'peri-peri', 'pizza'],
  },
  {
    id: 'bbq-chicken-overload',
    slug: 'bbq-chicken-overload',
    name: 'BBQ Chicken Overload',
    description:
      'Hickory BBQ marinated chicken cubes with caramelized onions, bacon bits, and sharp cheddar on hand-stretched base.',
    price: 529,
    image: resolveDishImageUrl('bbq-chicken-overload'),
    category: 'pizza',
    isVeg: false,
    isFeatured: false,
    isBestSeller: true,
    tags: ['bbq', 'chicken', 'pizza'],
  },
  {
    id: 'classic-smash-burger',
    slug: 'classic-smash-burger',
    name: 'Classic Smash Burger',
    description:
      'Double smashed tender patty with melted American cheese, house secret sauce, and dill pickles on toasted brioche.',
    price: 379,
    image: resolveDishImageUrl('classic-smash-burger'),
    category: 'burger',
    isVeg: false,
    isFeatured: true,
    isBestSeller: true,
    tags: ['burger', 'smash', 'charcoal'],
  },
  {
    id: 'golden-oak-signature-burger',
    slug: 'golden-oak-signature-burger',
    name: 'Golden Oak Signature Burger',
    description:
      'Triple-stack gourmet delight with caramelized balsamic onions, aged gouda, arugula, and truffle mayo on artisanal brioche.',
    price: 499,
    image: resolveDishImageUrl('golden-oak-signature-burger'),
    category: 'burger',
    isVeg: false,
    isFeatured: true,
    isBestSeller: false,
    tags: ['burger', 'signature', 'truffle'],
  },
  {
    id: 'crispy-paneer-burger',
    slug: 'crispy-paneer-burger',
    name: 'Crispy Paneer Burger',
    description:
      'Panko-crusted spiced cottage cheese steak with mint slaw and tangy tamarind reduction on toasted sesame brioche.',
    price: 349,
    image: resolveDishImageUrl('crispy-paneer-burger'),
    category: 'burger',
    isVeg: true,
    isFeatured: false,
    isBestSeller: false,
    tags: ['paneer', 'burger', 'crispy'],
  },
  {
    id: 'wok-tossed-chow-mein',
    slug: 'wok-tossed-chow-mein',
    name: 'Wok Tossed Chow Mein',
    description:
      'Hand-pulled noodles stir-fried with julienned vegetables in dark aged soy and toasted sesame oil with wok hei.',
    price: 299,
    image: resolveDishImageUrl('wok-tossed-chow-mein'),
    category: 'chinese',
    isVeg: true,
    isFeatured: false,
    isBestSeller: false,
    tags: ['chinese', 'wok', 'noodles'],
  },
  {
    id: 'dynamite-chilli-potatoes',
    slug: 'dynamite-chilli-potatoes',
    name: 'Dynamite Chilli Potatoes',
    description:
      'Twice-cooked crispy potato wedges tossed in spicy Szechuan sauce with spring onion, toasted sesame, and garlic chips.',
    price: 249,
    image: resolveDishImageUrl('dynamite-chilli-potatoes'),
    category: 'starters',
    isVeg: true,
    isFeatured: false,
    isBestSeller: true,
    spiceLevel: 'spicy',
    tags: ['spicy', 'fiery', 'potatoes', 'starters'],
  },
];

export function CulinarySpotlightModal() {
  const router = useRouter();
  const { isOpen, query, closeSpotlight, toggleSpotlight, setQuery } = useSpotlightStore();
  const addItem = useCartStore((s) => s.addItem);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [addedSlug, setAddedSlug] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Typewriter animated placeholder phrases
  const placeholderPhrases = useMemo(
    () => [
      'Search for Tandoori Paneer Pizza...',
      'Search for Black Truffle & Mushroom...',
      'Search for Fiery Szechuan Starters...',
      'Search dishes, wood-fired pizzas, truffle, or spice level...',
    ],
    []
  );
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderPhrases.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [placeholderPhrases.length]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K and ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleSpotlight();
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closeSpotlight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleSpotlight, closeSpotlight]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // 1-Click Craving Chips filter definitions
  const cravingChips = [
    { id: 'paneer', label: 'Paneer Specialties', filter: 'paneer' },
    { id: 'truffle', label: 'Truffle & Mushroom', filter: 'truffle' },
    { id: 'fiery', label: 'Fiery & Spicy', dotColor: '#E0532B', filter: 'spicy' },
    { id: '3d', label: '3D Ready Dishes', icon: Box, filter: '3d' },
    { id: 'veg', label: 'Pure Veg', dotColor: '#22C58B', filter: 'veg' },
  ];

  const handleChipClick = (filterVal: string) => {
    if (activeChip === filterVal) {
      setActiveChip(null);
      setQuery('');
    } else {
      setActiveChip(filterVal);
      if (filterVal === '3d') {
        setQuery('');
      } else {
        setQuery(filterVal);
      }
    }
  };

  // Filter Dishes based on search query and chip
  const filteredDishes = useMemo(() => {
    let list = [...SPOTLIGHT_CATALOG];
    const q = query.toLowerCase().trim();

    if (activeChip === 'veg') {
      list = list.filter((d) => d.isVeg);
    } else if (activeChip === '3d') {
      // all 10 have 3D models!
    } else if (activeChip === 'spicy') {
      list = list.filter(
        (d) =>
          d.spiceLevel === 'spicy' ||
          d.tags?.includes('spicy') ||
          d.tags?.includes('fiery') ||
          d.name.toLowerCase().includes('peri') ||
          d.name.toLowerCase().includes('dynamite')
      );
    }

    if (q) {
      list = list.filter((d) => {
        const nameMatch = d.name.toLowerCase().includes(q);
        const descMatch = d.description.toLowerCase().includes(q);
        const catMatch = d.category.toLowerCase().includes(q);
        const tagMatch = d.tags?.some((t) => t.includes(q));
        return nameMatch || descMatch || catMatch || tagMatch;
      });
    }

    return list;
  }, [query, activeChip]);

  // Active highlighted dish for preview column
  const activeDish = filteredDishes[selectedIndex] || filteredDishes[0];

  // Keyboard navigation within list
  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredDishes.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredDishes.length) % Math.max(1, filteredDishes.length));
    } else if (e.key === 'Enter' && activeDish) {
      e.preventDefault();
      closeSpotlight();
      router.push(`/3d/${activeDish.slug}`);
    }
  };

  const handleAddToCart = (dishItem: SpotlightDish, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const legacyDish: Dish = {
      id: dishItem.slug,
      slug: dishItem.slug,
      name: dishItem.name,
      description: dishItem.description,
      price: dishItem.price,
      image: dishItem.image,
      category: dishItem.category as any,
      isVeg: dishItem.isVeg,
      isAvailable: true,
      isFeatured: !!dishItem.isFeatured,
      isBestSeller: !!dishItem.isBestSeller,
      spiceLevel: (dishItem.spiceLevel as any) || 'medium',
      ingredients: [],
      has3DModel: true,
    };

    addItem(legacyDish, 1, {});
    setAddedSlug(dishItem.slug);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
    toast.success('Added to Order', `${dishItem.name} added to your bag.`);
    setTimeout(() => setAddedSlug(null), 1800);
  };

  // Matched Text Highlighter Helper
  const renderHighlightedName = (name: string, highlight: string) => {
    if (!highlight.trim()) return name;
    const parts = name.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark
              key={i}
              className="bg-[rgba(226,168,75,0.28)] text-[#FAF5EC] rounded-sm px-0.5"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Culinary Spotlight Command Palette"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[7vh] sm:pt-[9vh] px-3 sm:px-4 animate-in fade-in duration-200"
      style={{
        backgroundColor: 'rgba(13, 10, 8, 0.82)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSpotlight();
      }}
    >
      {/* Floating Luxury Glass Search Modal */}
      <div
        className="w-full max-w-[820px] rounded-2xl border border-[rgba(226,168,75,0.35)] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: '#14100D',
          backgroundImage:
            'radial-gradient(circle at 50% 0%, rgba(226, 168, 75, 0.20) 0%, transparent 65%)',
        }}
        onKeyDown={handleListKeyDown}
      >
        {/* ========================================================= */}
        {/* ZONE 1: Oversized Editorial Input Bar (Height: 72px)       */}
        {/* ========================================================= */}
        <div className="h-[70px] sm:h-[72px] px-5 sm:px-6 flex items-center gap-3.5 border-b border-[rgba(226,168,75,0.16)] bg-[#14100D]/90">
          <Search className="w-5 h-5 sm:w-6 sm:h-6 text-[#E2A84B] shrink-0" />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={placeholderPhrases[placeholderIndex]}
            aria-label="Search culinary archive"
            className="flex-1 h-full bg-transparent text-lg sm:text-[21px] text-[#FAF5EC] placeholder:text-[#9A9286]/55 placeholder:italic placeholder:font-serif outline-none font-light tracking-wide"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded text-[#9A9286] hover:text-[#FAF5EC] transition-colors"
              aria-label="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* ESC Shortcut Badge */}
          <button
            type="button"
            onClick={closeSpotlight}
            className="px-2 py-1 rounded bg-[#1F1914] border border-white/10 text-[#9A9286] hover:text-white text-[11px] font-mono tracking-wider transition-colors active:scale-95"
          >
            ESC
          </button>
        </div>

        {/* ========================================================= */}
        {/* ZONE 2: 1-Click Craving & Ingredient Chips                */}
        {/* ========================================================= */}
        <div className="px-5 sm:px-6 py-2.5 sm:py-3 bg-[#100C0A] border-b border-white/[0.04] flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-semibold text-[#9A9286] tracking-[0.2em] uppercase shrink-0 mr-1">
            POPULAR CRAVINGS:
          </span>

          {cravingChips.map((chip) => {
            const isChipActive = activeChip === chip.filter;
            const Icon = chip.icon;

            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleChipClick(chip.filter)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                  isChipActive
                    ? 'bg-[#0E1F18] border border-[#22C58B]/50 text-[#F6D386] shadow-[0_0_10px_rgba(34,197,139,0.25)]'
                    : 'bg-white/[0.04] border border-white/[0.08] text-[#9A9286] hover:text-[#FAF5EC] hover:bg-white/[0.08]'
                }`}
              >
                {chip.dotColor && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: chip.dotColor }}
                  />
                )}
                {Icon && <Icon className="w-3 h-3 text-[#E2A84B]" />}
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* ZONE 3: Split-Screen Live Results & 3D Preview             */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[340px] max-h-[420px] overflow-hidden">
          {/* Left Column (58% Width — Instant Dish Matches) */}
          <div className="md:col-span-7 overflow-y-auto no-scrollbar p-3 space-y-1.5 border-r border-white/[0.05]">
            {filteredDishes.length > 0 ? (
              filteredDishes.map((dish, idx) => {
                const isSelected = activeDish?.id === dish.id;

                return (
                  <div
                    key={dish.id}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => {
                      closeSpotlight();
                      router.push(`/3d/${dish.slug}`);
                    }}
                    className={`group flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-[#1D1612] border border-[rgba(226,168,75,0.35)] shadow-[0_4px_16px_rgba(0,0,0,0.5)] -translate-y-0.5'
                        : 'bg-transparent border border-transparent hover:bg-white/[0.03]'
                    }`}
                  >
                    {/* Left: Dish Thumbnail */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-dark shrink-0 border border-white/10 relative">
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>

                      {/* Middle: Name & Tags */}
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          {/* Veg/Non-Veg dot */}
                          <span
                            className={`w-2 h-2 rounded-[2px] border ${
                              dish.isVeg
                                ? 'border-[#22C58B] bg-[#22C58B]'
                                : 'border-[#F43F5E] bg-[#F43F5E]'
                            }`}
                          />
                          <h4 className="font-serif text-sm sm:text-[15px] font-semibold text-[#FAF5EC] truncate">
                            {renderHighlightedName(dish.name, query)}
                          </h4>
                        </div>

                        {/* Subtle Badge Row */}
                        <div className="flex items-center gap-2 mt-0.5">
                          {dish.isBestSeller && (
                            <span className="text-[9px] font-bold text-[#E0532B] uppercase tracking-wider">
                              Best Seller
                            </span>
                          )}
                          {dish.isFeatured && (
                            <span className="text-[9px] font-bold text-[#E2A84B] uppercase tracking-wider">
                              Featured
                            </span>
                          )}
                          <span className="text-[9px] text-[#9A9286] uppercase tracking-wider">
                            {dish.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Price & Quick Add Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs sm:text-sm font-bold text-[#FAF5EC]">
                        ₹{dish.price}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(dish, e)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          addedSlug === dish.slug
                            ? 'bg-[#22C58B] text-[#0D0A08]'
                            : 'bg-white/[0.05] hover:bg-[#E2A84B] text-[#E2A84B] hover:text-[#0D0A08] border border-white/10 active:scale-90'
                        }`}
                        title="Add to order"
                      >
                        {addedSlug === dish.slug ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              /* Zero-Result Chef Concierge Recommendation State */
              <div className="p-5 rounded-xl bg-[#0E1F18] border border-[#22C58B]/30 text-center flex flex-col items-center gap-2 my-4">
                <Sparkles className="w-6 h-6 text-[#E2A84B]" />
                <h4 className="font-serif text-base font-bold text-[#FAF5EC]">
                  Chef&apos;s Signature Recommendation
                </h4>
                <p className="text-xs text-[#B5ADA2] font-light max-w-xs leading-relaxed">
                  We don&apos;t currently serve &ldquo;{query}&rdquo;, but our Head Chef recommends
                  trying our <span className="text-[#E2A84B] font-semibold">Mushroom Truffle Sourdough Pizza</span> instead!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    closeSpotlight();
                    router.push('/3d/mushroom-truffle-pizza');
                  }}
                  className="mt-2 px-4 py-1.5 rounded-lg text-xs font-bold text-[#0D0A08] shadow-md transition-all active:scale-95"
                  style={{
                    background:
                      'linear-gradient(135deg, #F6D386 0%, #D49432 100%)',
                  }}
                >
                  View Mushroom Truffle Pizza →
                </button>
              </div>
            )}
          </div>

          {/* Right Column (42% Width — Live Dish & 3D Stage Card) */}
          <div className="hidden md:flex md:col-span-5 p-4 bg-[#0E1F18]/90 flex-col justify-between overflow-y-auto no-scrollbar">
            {activeDish ? (
              <div className="flex flex-col gap-3">
                {/* Large Photo Stage */}
                <div className="relative w-full h-[155px] rounded-xl overflow-hidden bg-dark border border-[rgba(226,168,75,0.25)] shadow-lg group">
                  <img
                    src={activeDish.image}
                    alt={activeDish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[#0D0A08]/80 backdrop-blur-md border border-[#E2A84B]/40 text-[10px] font-mono font-bold text-[#E2A84B] flex items-center gap-1">
                    <Box className="w-3 h-3" />
                    3D Ready
                  </div>
                </div>

                {/* Dish Identity & Full Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-serif text-base font-bold text-[#FAF5EC] leading-tight truncate">
                      {activeDish.name}
                    </h3>
                    <span className="font-mono text-sm font-bold text-[#E2A84B]">
                      ₹{activeDish.price}
                    </span>
                  </div>

                  <p className="text-[11.5px] text-[#B5ADA2] font-light leading-relaxed line-clamp-3">
                    {activeDish.description}
                  </p>
                </div>

                {/* Dual Action Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(activeDish, e)}
                    className="w-full py-2.5 rounded-lg text-[#0D0A08] font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{
                      background:
                        'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Bag · ₹{activeDish.price}</span>
                  </button>

                  <Link
                    href={`/3d/${activeDish.slug}`}
                    onClick={closeSpotlight}
                    className="w-full py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-[#FAF5EC] flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Box className="w-3.5 h-3.5 text-[#E2A84B]" />
                    <span>Inspect in 3D Studio →</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-[#9A9286] italic text-center">
                Hover over any creation to preview recipes &amp; 3D models.
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* ZONE 4: Concierge Command Footer (Height: 42px)           */}
        {/* ========================================================= */}
        <div className="h-[42px] px-5 sm:px-6 bg-[#0B0907] border-t border-[rgba(226,168,75,0.12)] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-3 text-[#9A9286]">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[10px] font-mono">
                ↑↓
              </kbd>{' '}
              to navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[10px] font-mono">
                ↵
              </kbd>{' '}
              to open 3D
            </span>
          </div>

          <span className="font-mono text-[#E2A84B] font-semibold">
            {filteredDishes.length} Curated Dishes Available
          </span>
        </div>
      </div>
    </div>
  );
}
