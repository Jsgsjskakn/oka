'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Plus, Minus, Trash2, Box, Sparkles, Flame, Check, Tag, UtensilsCrossed, ChevronRight } from 'lucide-react';
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
  originalPrice: number;
  discountPercent: number; // 10, 20, 30% OFF
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
    originalPrice: 499,
    discountPercent: 10,
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
    originalPrice: 624,
    discountPercent: 20,
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
    originalPrice: 785,
    discountPercent: 30,
    image: resolveDishImageUrl('mushroom-truffle-pizza'),
    category: 'pizza',
    isVeg: true,
    isFeatured: true,
    isBestSeller: false,
    tags: ['mushroom', 'truffle', 'pizza', 'wood-fired', 'gourmet'],
  },
  {
    id: 'peri-peri-fiesta-pizza',
    slug: 'peri-peri-fiesta-pizza',
    name: 'Peri Peri Fiesta Pizza',
    description:
      'Spicy peri peri sauce base with roasted capsicum, corn, black olives, and a fresh herb drizzle on crispy crust.',
    price: 429,
    originalPrice: 539,
    discountPercent: 20,
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
    originalPrice: 589,
    discountPercent: 10,
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
    originalPrice: 475,
    discountPercent: 20,
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
    originalPrice: 715,
    discountPercent: 30,
    image: resolveDishImageUrl('golden-oak-signature-burger'),
    category: 'burger',
    isVeg: false,
    isFeatured: true,
    isBestSeller: false,
    tags: ['burger', 'signature', 'truffle', 'gourmet'],
  },
  {
    id: 'crispy-paneer-burger',
    slug: 'crispy-paneer-burger',
    name: 'Crispy Paneer Burger',
    description:
      'Panko-crusted spiced cottage cheese steak with mint slaw and tangy tamarind reduction on toasted sesame brioche.',
    price: 349,
    originalPrice: 389,
    discountPercent: 10,
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
    originalPrice: 375,
    discountPercent: 20,
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
    originalPrice: 355,
    discountPercent: 30,
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
  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [addedSlug, setAddedSlug] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Typewriter animated placeholder phrases
  const placeholderPhrases = useMemo(
    () => [
      'Search for Tandoori Paneer Pizza (10% OFF)...',
      'Search for Black Truffle & Mushroom (30% OFF)...',
      'Search for Gourmet Smash Burgers (20% OFF)...',
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

  // Top Category Tabs with Live Counts
  const categoryTabs = useMemo(() => {
    return [
      { id: 'all', label: 'All Items', icon: Sparkles, count: SPOTLIGHT_CATALOG.length },
      { id: 'pizza', label: 'Wood-Fired Pizzas', emoji: '🍕', count: SPOTLIGHT_CATALOG.filter((d) => d.category === 'pizza').length },
      { id: 'burger', label: 'Gourmet Burgers', emoji: '🍔', count: SPOTLIGHT_CATALOG.filter((d) => d.category === 'burger').length },
      { id: 'chinese', label: 'Wok Specialties', emoji: '🥢', count: SPOTLIGHT_CATALOG.filter((d) => d.category === 'chinese').length },
      { id: 'starters', label: 'Sizzling Starters', emoji: '🌶️', count: SPOTLIGHT_CATALOG.filter((d) => d.category === 'starters').length },
    ];
  }, []);

  // Upgraded Popular Cravings & Offers Chips (Enlarged with Luxury Design)
  const cravingChips = [
    {
      id: 'discount',
      label: 'Special Offers',
      badge: 'Up to 30% OFF',
      icon: Tag,
      filter: 'discount',
      highlightColor: '#F59E0B',
    },
    {
      id: 'bestseller',
      label: "Chef's Best Sellers",
      badge: 'POPULAR',
      icon: Flame,
      filter: 'bestseller',
      highlightColor: '#EF4444',
    },
    {
      id: 'truffle',
      label: 'Truffle & Gourmet',
      icon: Sparkles,
      filter: 'truffle',
      highlightColor: '#E2A84B',
    },
    {
      id: 'spicy',
      label: 'Fiery & Spicy',
      dotColor: '#E0532B',
      filter: 'spicy',
      highlightColor: '#E0532B',
    },
    {
      id: 'veg',
      label: '100% Pure Veg',
      dotColor: '#22C58B',
      filter: 'veg',
      highlightColor: '#22C58B',
    },
    {
      id: '3d',
      label: '3D Studio Ready',
      icon: Box,
      filter: '3d',
      highlightColor: '#38BDF8',
    },
  ];

  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    setSelectedIndex(0);
  };

  const handleChipClick = (filterVal: string) => {
    if (activeChip === filterVal) {
      setActiveChip(null);
    } else {
      setActiveChip(filterVal);
    }
    setSelectedIndex(0);
  };

  // Filter Dishes based on search query, category tab, and cravings chip
  const filteredDishes = useMemo(() => {
    let list = [...SPOTLIGHT_CATALOG];
    const q = query.toLowerCase().trim();

    // 1. Category Tab Filter
    if (activeCategory !== 'all') {
      list = list.filter((d) => d.category === activeCategory);
    }

    // 2. Craving Chip Filter
    if (activeChip === 'veg') {
      list = list.filter((d) => d.isVeg);
    } else if (activeChip === 'bestseller') {
      list = list.filter((d) => d.isBestSeller);
    } else if (activeChip === 'discount') {
      list = list.filter((d) => d.discountPercent >= 20);
    } else if (activeChip === '3d') {
      // all 10 have 3D models
    } else if (activeChip === 'spicy') {
      list = list.filter(
        (d) =>
          d.spiceLevel === 'spicy' ||
          d.tags?.includes('spicy') ||
          d.tags?.includes('fiery') ||
          d.name.toLowerCase().includes('peri') ||
          d.name.toLowerCase().includes('dynamite')
      );
    } else if (activeChip === 'truffle') {
      list = list.filter(
        (d) =>
          d.tags?.includes('truffle') ||
          d.description.toLowerCase().includes('truffle') ||
          d.name.toLowerCase().includes('truffle')
      );
    }

    // 3. Search Query Text Match
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
  }, [query, activeCategory, activeChip]);

  // Active highlighted dish for preview column
  const activeDish = filteredDishes[selectedIndex] || filteredDishes[0];

  // Keyboard navigation within list with auto-scroll into view
  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = (prev + 1) % Math.max(1, filteredDishes.length);
        scrollSelectedIntoView(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = (prev - 1 + filteredDishes.length) % Math.max(1, filteredDishes.length);
        scrollSelectedIntoView(next);
        return next;
      });
    } else if (e.key === 'Enter' && activeDish) {
      e.preventDefault();
      closeSpotlight();
      router.push(`/3d/${activeDish.slug}`);
    }
  };

  const scrollSelectedIntoView = (index: number) => {
    if (!listContainerRef.current) return;
    const items = listContainerRef.current.querySelectorAll('[data-dish-item]');
    const targetItem = items[index] as HTMLElement;
    if (targetItem) {
      targetItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
      originalPrice: dishItem.originalPrice,
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
    toast.success('Added to Bag', `${dishItem.name} (Save ₹${dishItem.originalPrice - dishItem.price}) added.`);
    setTimeout(() => setAddedSlug(null), 1800);
  };

  const handleDecrementActiveDish = (dishItem: SpotlightDish, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const item = cartItems.find((i) => i.dish.id === dishItem.id || i.dish.slug === dishItem.slug);
    if (!item) return;

    if (item.quantity > 1) {
      updateQuantity(item.cartItemId, item.quantity - 1);
      toast.info('Updated Quantity', `${dishItem.name} (×${item.quantity - 1})`);
    } else {
      removeItem(item.cartItemId);
      toast.info('Removed from Bag', dishItem.name);
    }
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
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
              className="bg-[rgba(226,168,75,0.3)] text-[#FAF5EC] rounded-sm px-0.5"
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
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[5vh] sm:pt-[7vh] px-3 sm:px-4 animate-in fade-in duration-200"
      style={{
        backgroundColor: 'rgba(10, 8, 6, 0.86)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSpotlight();
      }}
    >
      {/* Floating Luxury Glass Search Modal */}
      <div
        className="w-full max-w-[880px] rounded-2xl border border-[rgba(226,168,75,0.38)] shadow-[0_30px_90px_rgba(0,0,0,0.92)] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: '#130E0B',
          backgroundImage:
            'radial-gradient(circle at 50% 0%, rgba(226, 168, 75, 0.22) 0%, transparent 60%)',
        }}
        onKeyDown={handleListKeyDown}
      >
        {/* ========================================================= */}
        {/* ZONE 1: Oversized Editorial Input Bar (Height: 70px)       */}
        {/* ========================================================= */}
        <div className="h-[68px] sm:h-[72px] px-5 sm:px-6 flex items-center gap-3.5 border-b border-[rgba(226,168,75,0.18)] bg-[#130E0B]/95">
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
            className="flex-1 h-full bg-transparent text-lg sm:text-[21px] text-[#FAF5EC] placeholder:text-[#9A9286]/60 placeholder:italic placeholder:font-serif outline-none font-light tracking-wide"
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
            className="px-2.5 py-1 rounded bg-[#1F1914] border border-white/10 text-[#9A9286] hover:text-white text-[11px] font-mono tracking-wider transition-colors active:scale-95 cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* ========================================================= */}
        {/* ZONE 1.5: CATEGORIES SELECTOR BAR (Requested by User)     */}
        {/* ========================================================= */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#17110D] border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-mono font-bold text-[#E2A84B] tracking-[0.2em] uppercase shrink-0 mr-1 flex items-center gap-1">
            <UtensilsCrossed className="w-3 h-3 text-[#E2A84B]" />
            <span>CATEGORIES:</span>
          </span>

          {categoryTabs.map((cat) => {
            const isActive = activeCategory === cat.id;
            const Icon = cat.icon;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 active:scale-95 cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#E2A84B]/20 border border-[#E2A84B] text-[#FAF5EC] shadow-[0_0_15px_rgba(226,168,75,0.3)] font-semibold'
                    : 'bg-white/[0.04] border border-white/[0.08] text-[#A69F94] hover:text-[#FAF5EC] hover:bg-white/[0.08] hover:border-white/20'
                }`}
              >
                {cat.emoji && <span className="text-sm">{cat.emoji}</span>}
                {Icon && <Icon className="w-3.5 h-3.5 text-[#E2A84B]" />}
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-[#E2A84B] text-[#130E0B] font-bold'
                      : 'bg-white/10 text-[#A69F94]'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* ZONE 2: POPULAR CRAVINGS & DISCOUNTS (Bigger & Redesigned)*/}
        {/* ========================================================= */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#0E0B09] border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-mono font-bold text-[#A69F94] tracking-[0.2em] uppercase shrink-0 mr-1">
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
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-[13px] font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 active:scale-95 cursor-pointer shadow-sm select-none ${
                  isChipActive
                    ? 'bg-gradient-to-r from-[#2B1E12] to-[#1E1710] border border-[#E2A84B] text-[#FAF5EC] shadow-[0_0_18px_rgba(226,168,75,0.35)] font-semibold'
                    : 'bg-gradient-to-r from-white/[0.05] to-white/[0.02] border border-white/[0.09] text-[#A69F94] hover:text-[#FAF5EC] hover:border-[#E2A84B]/40 hover:bg-white/[0.07]'
                }`}
              >
                {chip.dotColor && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: chip.dotColor }}
                  />
                )}
                {Icon && (
                  <Icon
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: chip.highlightColor || '#E2A84B' }}
                  />
                )}
                <span>{chip.label}</span>

                {chip.badge && (
                  <span
                    className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                      isChipActive
                        ? 'bg-[#E2A84B] text-[#130E0B]'
                        : 'bg-[#E0532B]/20 text-[#E0532B] border border-[#E0532B]/30'
                    }`}
                  >
                    {chip.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* ZONE 3: Split-Screen Live Results & 3D Preview             */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 h-[450px] sm:h-[490px] max-h-[58vh] overflow-hidden">
          {/* Left Column (58% Width — Smoothly Scrollable Dish List) */}
          <div
            ref={listContainerRef}
            tabIndex={0}
            role="region"
            aria-label="Dish Search Results List"
            className="md:col-span-7 h-full overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-2 border-r border-white/[0.06] [scrollbar-width:thin] [scrollbar-color:rgba(226,168,75,0.45)_rgba(0,0,0,0.35)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black/40 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#E2A84B]/40 hover:[&::-webkit-scrollbar-thumb]:bg-[#E2A84B]/80 [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {filteredDishes.length > 0 ? (
              filteredDishes.map((dish, idx) => {
                const isSelected = activeDish?.id === dish.id;

                return (
                  <div
                    key={dish.id}
                    data-dish-item
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => {
                      closeSpotlight();
                      router.push(`/3d/${dish.slug}`);
                    }}
                    className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-[#1F1712] border border-[rgba(226,168,75,0.45)] shadow-[0_4px_18px_rgba(0,0,0,0.6)] -translate-y-0.5'
                        : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/10'
                    }`}
                  >
                    {/* Left: Dish Thumbnail */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/10 relative shadow-sm">
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

                        {/* Badges Row */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {dish.isBestSeller && (
                            <span className="text-[9px] font-bold text-[#E0532B] uppercase tracking-wider bg-[#E0532B]/12 px-1.5 py-0.2 rounded">
                              Best Seller
                            </span>
                          )}
                          {dish.isFeatured && (
                            <span className="text-[9px] font-bold text-[#E2A84B] uppercase tracking-wider bg-[#E2A84B]/12 px-1.5 py-0.2 rounded">
                              Featured
                            </span>
                          )}
                          <span className="text-[9.5px] text-[#A69F94] uppercase tracking-wider font-mono">
                            {dish.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Price with Strikethrough Discount & Quick Add Button */}
                    <div className="flex items-center gap-2.5 shrink-0 pl-1">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5">
                          {dish.originalPrice && (
                            <span className="font-mono text-[11px] text-[#8C8477] line-through decoration-white/40">
                              ₹{dish.originalPrice}
                            </span>
                          )}
                          <span className="font-mono text-sm sm:text-[15px] font-bold text-[#FAF5EC]">
                            ₹{dish.price}
                          </span>
                        </div>

                        {dish.discountPercent && (
                          <span className="text-[9.5px] font-mono font-bold text-[#E0532B] bg-[#E0532B]/15 border border-[#E0532B]/35 px-1.5 py-0.2 rounded-md mt-0.5">
                            {dish.discountPercent}% OFF
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(dish, e)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          addedSlug === dish.slug
                            ? 'bg-[#22C58B] text-[#0D0A08] shadow-[0_0_12px_rgba(34,197,139,0.4)]'
                            : 'bg-white/[0.06] hover:bg-[#E2A84B] text-[#E2A84B] hover:text-[#0D0A08] border border-white/10 active:scale-90 shadow-sm'
                        }`}
                        title="Add to order"
                      >
                        {addedSlug === dish.slug ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          (() => {
                            const itemInCart = cartItems.find((i) => i.dish.id === dish.id || i.dish.slug === dish.slug);
                            return itemInCart && itemInCart.quantity > 0 ? (
                              <span className="font-mono text-[11px] font-black text-[#E2A84B]">{itemInCart.quantity}</span>
                            ) : (
                              <Plus className="w-4 h-4" />
                            );
                          })()
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              /* Zero-Result Chef Concierge Recommendation State */
              <div className="p-6 rounded-2xl bg-[#0E1F18] border border-[#22C58B]/30 text-center flex flex-col items-center gap-2.5 my-4">
                <Sparkles className="w-7 h-7 text-[#E2A84B]" />
                <h4 className="font-serif text-base font-bold text-[#FAF5EC]">
                  Chef&apos;s Signature Recommendation
                </h4>
                <p className="text-xs text-[#B5ADA2] font-light max-w-xs leading-relaxed">
                  We don&apos;t currently find &ldquo;{query}&rdquo; under this filter, but our Head Chef recommends
                  trying our <span className="text-[#E2A84B] font-semibold">Mushroom Truffle Sourdough Pizza (30% OFF)</span> instead!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    closeSpotlight();
                    router.push('/3d/mushroom-truffle-pizza');
                  }}
                  className="mt-2 px-5 py-2 rounded-xl text-xs font-bold text-[#0D0A08] shadow-md transition-all active:scale-95 cursor-pointer"
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
          <div className="hidden md:flex md:col-span-5 p-4 sm:p-5 bg-[#0E1F18]/90 flex-col justify-between overflow-y-auto no-scrollbar">
            {activeDish ? (
              <div className="flex flex-col gap-3">
                {/* Large Photo Stage */}
                <div className="relative w-full h-[165px] rounded-xl overflow-hidden bg-dark border border-[rgba(226,168,75,0.3)] shadow-lg group">
                  <img
                    src={activeDish.image}
                    alt={activeDish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[#0D0A08]/85 backdrop-blur-md border border-[#E2A84B]/40 text-[10px] font-mono font-bold text-[#E2A84B] flex items-center gap-1 shadow-sm">
                    <Box className="w-3 h-3" />
                    3D Ready
                  </div>

                  {activeDish.discountPercent && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-[#E0532B] text-white text-[10px] font-mono font-bold shadow-md">
                      SAVE {activeDish.discountPercent}% TODAY
                    </div>
                  )}
                </div>

                {/* Dish Identity & Full Description */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-serif text-base sm:text-lg font-bold text-[#FAF5EC] leading-tight truncate">
                      {activeDish.name}
                    </h3>
                  </div>

                  {/* Pricing with Original Price & Discount Banner */}
                  <div className="flex items-baseline justify-between mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-lg font-bold text-[#E2A84B]">
                        ₹{activeDish.price}
                      </span>
                      {activeDish.originalPrice && (
                        <span className="font-mono text-xs text-[#8C8477] line-through">
                          ₹{activeDish.originalPrice}
                        </span>
                      )}
                    </div>
                    {activeDish.discountPercent && (
                      <span className="px-2 py-0.5 rounded-full bg-[#E0532B]/20 border border-[#E0532B]/40 text-[#E0532B] text-[10.5px] font-mono font-bold">
                        {activeDish.discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Savings Highlight Box */}
                  {activeDish.originalPrice && (
                    <div className="px-2.5 py-1.5 rounded-lg bg-[#E2A84B]/10 border border-[#E2A84B]/25 text-[11px] text-[#E2A84B] flex items-center justify-between mb-2">
                      <span className="flex items-center gap-1 font-medium">
                        <Sparkles className="w-3 h-3 text-[#E2A84B]" />
                        <span>Dining Discount</span>
                      </span>
                      <span className="font-bold font-mono">
                        Save ₹{activeDish.originalPrice - activeDish.price}
                      </span>
                    </div>
                  )}

                  <p className="text-[11.5px] text-[#B5ADA2] font-light leading-relaxed line-clamp-3">
                    {activeDish.description}
                  </p>
                </div>

                {/* Dual Action Buttons */}
                <div className="flex flex-col gap-2 pt-1">
                  {(() => {
                    const activeDishCartItem = cartItems.find((i) => i.dish.id === activeDish.id || i.dish.slug === activeDish.slug);
                    const activeDishQty = activeDishCartItem?.quantity || 0;

                    if (activeDishQty === 0) {
                      return (
                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(activeDish, e)}
                          className="w-full py-2.5 rounded-xl text-[#0D0A08] font-bold text-xs sm:text-[13px] shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer hover:brightness-105"
                          style={{
                            background:
                              'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                          }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Bag · ₹{activeDish.price}</span>
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-xl overflow-hidden border border-[#E2A84B]/60 shadow-lg bg-[#0A0806] h-10 px-1">
                          <button
                            type="button"
                            onClick={(e) => handleDecrementActiveDish(activeDish, e)}
                            title={activeDishQty === 1 ? 'Remove from bag' : 'Decrease quantity'}
                            className="w-8 h-8 flex items-center justify-center text-[#E2A84B] hover:bg-white/[0.08] rounded active:scale-90 transition-all cursor-pointer"
                          >
                            {activeDishQty === 1 ? (
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            ) : (
                              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                            )}
                          </button>
                          <div className="px-2 text-center font-mono select-none">
                            <span className="text-xs font-bold text-[#FAF5EC]">{activeDishQty}</span>
                            <span className="text-[10px] text-[#E2A84B] ml-1">in bag</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleAddToCart(activeDish, e)}
                            title="Add more"
                            className="w-8 h-8 flex items-center justify-center text-[#E2A84B] hover:bg-white/[0.08] rounded active:scale-90 transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(activeDish, e)}
                          className="flex-1 py-2.5 rounded-xl text-[#0D0A08] font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer hover:brightness-105"
                          style={{
                            background:
                              'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                          }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add More · ₹{activeDish.price}</span>
                        </button>
                      </div>
                    );
                  })()}

                  <Link
                    href={`/3d/${activeDish.slug}`}
                    onClick={closeSpotlight}
                    className="w-full py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-[#FAF5EC] flex items-center justify-center gap-1.5 transition-all active:scale-95"
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
        <div className="h-[44px] px-5 sm:px-6 bg-[#0A0806] border-t border-[rgba(226,168,75,0.15)] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-3 text-[#9A9286]">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[10px] font-mono">
                ↑↓
              </kbd>{' '}
              to scroll list
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[10px] font-mono">
                ↵
              </kbd>{' '}
              to inspect 3D
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[#E2A84B] font-semibold">
              {filteredDishes.length} Dishes Available
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded">
              10%–30% OFF LIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
