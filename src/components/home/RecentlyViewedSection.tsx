'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, History, ArrowRight, ChevronLeft } from 'lucide-react';
import { useRecentlyViewedStore } from '@/store/recently-viewed-store';
import { useCartStore } from '@/store/cart-store';
import { toast } from '@/store/toast-store';
import { formatMoney } from '@/lib/db/types';

const CURATED_EXPLORE_DISHES = [
  {
    id: 'chicken-tikka-pizza',
    slug: 'chicken-tikka-pizza',
    name: 'Chicken Tikka Pizza',
    description: 'Charcoal chicken tikka with spiced makhani reduction',
    price_paise: 49900,
    image_url: '/images/dishes/chicken-tikka-pizza.webp',
    category: 'pizza',
    is_veg: false,
    is_available: true,
    is_featured: true,
    is_best_seller: true,
    spice_level: 'medium',
    has_3d_model: true,
  },
  {
    id: 'tandoori-paneer-pizza',
    slug: 'tandoori-paneer-pizza',
    name: 'Tandoori Paneer Pizza',
    description: 'Wood-fired sourdough with smoked paneer and fior di latte',
    price_paise: 44900,
    image_url: '/images/dishes/tandoori-paneer-pizza.webp',
    category: 'pizza',
    is_veg: true,
    is_available: true,
    is_featured: true,
    is_best_seller: true,
    spice_level: 'medium',
    has_3d_model: true,
  },
  {
    id: 'dynamite-chilli-potatoes',
    slug: 'dynamite-chilli-potatoes',
    name: 'Dynamite Chilli Potato',
    description: 'Crisp hand-cut potatoes glazed in birds eye wok reduction',
    price_paise: 24900,
    image_url: '/images/dishes/dynamite-chilli-potatoes.webp',
    category: 'starters',
    is_veg: true,
    is_available: true,
    is_featured: false,
    is_best_seller: true,
    spice_level: 'hot',
    has_3d_model: true,
  },
];

export function RecentlyViewedSection() {
  const [isMounted, setIsMounted] = useState(false);
  const recentDishes = useRecentlyViewedStore((s) => s.recentDishes);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const displayDishes =
    isMounted && recentDishes.length > 0
      ? recentDishes.slice(0, 3)
      : CURATED_EXPLORE_DISHES;

  const handleQuickAdd = (dish: any) => {
    addItem(
      {
        id: dish.id,
        slug: dish.slug,
        name: dish.name,
        description: dish.description || '',
        price: dish.price_paise ? dish.price_paise / 100 : 0,
        image: dish.image_url || '/images/dishes/placeholder.jpg',
        category: (dish.categories?.slug || dish.category || 'pizza') as any,
        isVeg: dish.is_veg,
        isAvailable: dish.is_available ?? true,
        isFeatured: dish.is_featured ?? false,
        isBestSeller: dish.is_best_seller ?? false,
        spiceLevel: dish.spice_level || 'mild',
        has3DModel: true,
      },
      1
    );
    toast.success('Added to Cart', `${dish.name} (${formatMoney(dish.price_paise)})`);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(15);
  };

  return (
    <section className="px-6 md:px-12 max-w-7xl mx-auto w-full pt-4 sm:pt-6 select-none">
      {/* Continue Exploring Bar: Luxury Dark Walnut Glass Surface */}
      <div className="w-full min-h-[76px] px-5 py-3 rounded-2xl flex flex-wrap md:flex-nowrap items-center justify-between gap-4 border border-[rgba(240,195,107,0.22)] bg-[rgba(23,16,12,0.85)] backdrop-blur-xl shadow-[0_12px_35px_rgba(0,0,0,0.65)]">
        {/* Left Label & Decorative Chevron */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#F0C36B]" />
            <span className="text-xs uppercase tracking-[0.22em] text-[#D1C3B1] font-semibold">
              CONTINUE EXPLORING
            </span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#F0C36B]">
            <ChevronLeft className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Horizontal Row of Dishes */}
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto hide-scrollbar py-1 flex-1">
          {displayDishes.map((dish) => (
            <div
              key={dish.id}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-xl bg-white/[0.03] border border-white/[0.08] shrink-0 group hover:border-[#F0C36B]/50 transition-all hover:bg-white/[0.05]"
            >
              {/* 54x54px Square Thumbnail */}
              <Link
                href={`/3d/${dish.slug}`}
                className="relative w-[50px] h-[50px] rounded-lg overflow-hidden bg-black/50 shrink-0 border border-white/10"
              >
                <Image
                  src={dish.image_url || '/images/dishes/placeholder.jpg'}
                  alt={dish.name}
                  fill
                  sizes="50px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </Link>

              {/* Title & Price */}
              <div className="flex flex-col min-w-0 pr-1">
                <Link
                  href={`/3d/${dish.slug}`}
                  className="font-serif text-xs sm:text-[13px] font-semibold text-[#F8F2E8] truncate group-hover:text-[#F0C36B] transition-colors max-w-[140px] sm:max-w-[180px]"
                >
                  {dish.name}
                </Link>
                <span className="font-mono text-xs font-bold text-[#F0C36B] mt-0.5">
                  {formatMoney(dish.price_paise)}
                </span>
              </div>

              {/* Quick Add + Button */}
              <button
                type="button"
                onClick={() => handleQuickAdd(dish)}
                className="w-7 h-7 rounded-lg bg-[#F0C36B]/15 hover:bg-[#F0C36B] border border-[#F0C36B]/40 hover:border-[#F0C36B] text-[#F0C36B] hover:text-[#17100C] flex items-center justify-center transition-all active:scale-90 shrink-0 cursor-pointer shadow-sm"
                title={`Add ${dish.name} to order`}
                aria-label={`Add ${dish.name} to order`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          ))}
        </div>

        {/* Right Action: Full Menu */}
        <Link
          href="/menu"
          className="flex items-center gap-1.5 text-xs font-bold text-[#F0C36B] hover:text-[#FFE1A0] transition-colors shrink-0 group py-1.5 pl-2"
        >
          <span>Full Menu</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
