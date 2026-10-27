'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  UtensilsCrossed,
  Armchair,
  ArrowRight,
  Plus,
  Compass,
  ChevronLeft,
  RotateCw,
  Box,
} from 'lucide-react';
import { Hero3DPedestal } from './Hero3DPedestal';
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
  },
];

export function HeroSection() {
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
    <section className="relative w-full overflow-hidden bg-[#0B0907] text-[#F8F2E8] flex flex-col justify-between min-h-[90vh] lg:min-h-screen pt-16 sm:pt-20 pb-2 sm:pb-3 select-none">
      {/* Background Restaurant Photography - User Uploaded Masterpiece */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Image
          src="/images/hero-artisan-pizza.jpg"
          alt="The Golden Oak Artisanal Dining Ambience & Wood-Fired Truffle Pizza"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_center] lg:object-center filter brightness-[1.02] contrast-[1.04]"
        />

        {/* Ambient Vignette & Text Contrast Scrim (Preserves Oven Fire & Pizza Vibrancy) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 25% 45%, rgba(11, 9, 7, 0.88) 0%, rgba(11, 9, 7, 0.65) 45%, rgba(11, 9, 7, 0.15) 75%, transparent 100%), linear-gradient(to top, rgba(11, 9, 7, 0.94) 0%, rgba(11, 9, 7, 0.4) 12%, transparent 25%), linear-gradient(to right, rgba(11, 9, 7, 0.75) 0%, transparent 55%)',
          }}
        />
      </div>

      {/* Main 12-Column Editorial Hero Container */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-12 pt-4 sm:pt-6 pb-2 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center w-full min-h-[400px] sm:min-h-[460px]">
          {/* Left 7 Columns: Editorial Typography & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left select-none pt-4 pb-4">
            {/* Overline Eyebrow Tag */}
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#F0C36B] font-semibold font-mono">
                EST. BENGALURU · WOOD-FIRED &amp; 3D GASTRONOMY
              </span>
              <span className="w-8 sm:w-12 h-[1px] bg-gradient-to-r from-[#F0C36B] to-transparent" />
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-[54px] xl:text-[60px] font-bold text-[#F8F2E8] leading-[1.08] tracking-tight mb-4 sm:mb-5 drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)]">
              Where Heritage Flavors Meet{' '}
              <span className="italic text-[#F0C36B] font-normal block sm:inline drop-shadow-[0_2px_16px_rgba(240,195,107,0.45)]">
                Artisanal Innovation
              </span>
            </h1>

            {/* Subtitle / Paragraph */}
            <p className="max-w-[520px] text-sm sm:text-base lg:text-[16px] text-[#D4C7B6] font-light leading-relaxed mb-6 sm:mb-8 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              Experience hand-stretched wood-fired sourdough pizzas, charcoal tandoori delicacies, and handcrafted fusion street fare crafted with organic local spices.
            </p>

            {/* CTA Button Pair */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3.5 mb-2 w-full sm:w-auto">
              <Link
                href="/menu"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 sm:px-8 sm:py-4 text-xs sm:text-[13px] font-bold text-[#17100C] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_25px_rgba(240,195,107,0.45)] active:scale-95 shadow-lg rounded-xl group cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #F0C36B 0%, #DDA33E 50%, #A8792A 100%)',
                }}
                title="Explore Culinary Menu"
                aria-label="Explore Culinary Menu"
              >
                <UtensilsCrossed className="w-4 h-4 text-[#17100C]" />
                <span>Explore Culinary Menu</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <Link
                href="/booking"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 sm:px-8 sm:py-4 text-xs sm:text-[13px] font-semibold text-[#F8F2E8] border border-[#F0C36B]/50 hover:border-[#F0C36B] hover:bg-[#F0C36B]/15 hover:shadow-[0_0_20px_rgba(240,195,107,0.25)] backdrop-blur-md rounded-xl transition-all duration-300 active:scale-95 cursor-pointer shadow-md"
                style={{
                  background: 'rgba(16, 12, 9, 0.55)',
                }}
                title="Reserve a Table"
                aria-label="Reserve a Table"
              >
                <Armchair className="w-4 h-4 text-[#F0C36B]" />
                <span>Reserve a Table</span>
              </Link>
            </div>
          </div>

          {/* Right 5 Columns: Interactive Hotspot Overlay Linking to 3D Food Studio */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[300px] sm:min-h-[380px]">
            <Link
              href="/3d/mushroom-truffle-pizza"
              className="absolute inset-0 z-20 cursor-pointer flex flex-col items-center justify-center group"
              title="Click to explore Mushroom Truffle Pizza in 3D Food Lounge"
            >
              <div className="w-[300px] sm:w-[380px] h-[300px] sm:h-[380px] rounded-full border border-[#F0C36B]/0 group-hover:border-[#F0C36B]/30 group-hover:bg-[#F0C36B]/05 transition-all duration-500 pointer-events-none" />
            </Link>
          </div>
        </div>

        {/* 360 Live 3D Menu Pill Centered Beneath the Pizza Platter */}
        <div className="hidden lg:block absolute bottom-8 left-[68%] -translate-x-1/2 z-30 pointer-events-auto">
          <Link
            href="/3d/mushroom-truffle-pizza"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs text-[#F8F2E8] transition-all duration-300 hover:scale-105 hover:border-[#F0C36B] hover:text-[#F0C36B] hover:shadow-[0_0_24px_rgba(240,195,107,0.6)] group whitespace-nowrap shadow-2xl"
            style={{
              background: 'rgba(16, 12, 9, 0.88)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid rgba(240, 195, 107, 0.65)',
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 8px 24px rgba(0, 0, 0, 0.85)',
            }}
            title="Drag to Rotate 360° · Live 3D Menu"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#F0C36B] group-hover:rotate-180 transition-transform duration-500" />
            <span className="font-medium tracking-wide">Drag to Rotate 360° · Live 3D Menu</span>
            <Box className="w-3.5 h-3.5 text-[#F0C36B]/90" />
          </Link>
        </div>
      </div>

      {/* Bottom Floating "Continue Exploring" Strip docked directly inside hero */}
      <div className="relative z-20 max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 pb-1 sm:pb-2 pt-0 mt-auto select-none">
        <div className="w-full px-4 sm:px-5 py-2 rounded-2xl flex flex-wrap md:flex-nowrap items-center justify-between gap-3 border border-[#F0C36B]/25 bg-[rgba(10,8,6,0.85)] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.14),0_20px_45px_rgba(0,0,0,0.85)]">
          {/* Left Label & Decorative Chevron */}
          <div className="flex items-center gap-2 shrink-0">
            <Compass className="w-4 h-4 text-[#F0C36B]" />
            <span className="text-[10.5px] sm:text-[11px] uppercase tracking-[0.22em] text-[#D1C3B1] font-semibold">
              CONTINUE EXPLORING
            </span>
            <div className="w-5.5 h-5.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-[#F0C36B] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <ChevronLeft className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Horizontal Row of Dishes - Compacted per user request */}
          <div className="flex items-center gap-2.5 overflow-x-auto hide-scrollbar py-0.5 flex-1">
            {displayDishes.map((dish) => (
              <div
                key={dish.id}
                className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl bg-[rgba(20,15,11,0.80)] border border-[#F0C36B]/20 hover:border-[#F0C36B]/50 hover:bg-[#F0C36B]/10 backdrop-blur-xl transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.5)] shrink-0 group"
              >
                {/* 38x38px Compact Thumbnail */}
                <Link
                  href={`/3d/${dish.slug}`}
                  className="relative w-[38px] h-[38px] rounded-lg overflow-hidden bg-black/50 shrink-0 border border-white/10 group-hover:border-[#F0C36B]/40"
                >
                  <Image
                    src={dish.image_url || '/images/dishes/placeholder.jpg'}
                    alt={dish.name}
                    fill
                    sizes="38px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                {/* Title & Price */}
                <div className="flex flex-col min-w-0 pr-1">
                  <Link
                    href={`/3d/${dish.slug}`}
                    className="font-serif text-xs font-semibold text-[#F8F2E8] truncate group-hover:text-[#F0C36B] transition-colors max-w-[110px] sm:max-w-[135px] leading-tight"
                  >
                    {dish.name}
                  </Link>
                  <span className="font-mono text-[10.5px] font-bold text-[#F0C36B] mt-0.5">
                    {formatMoney(dish.price_paise)}
                  </span>
                </div>

                {/* Quick Add + Button */}
                <button
                  type="button"
                  onClick={() => handleQuickAdd(dish)}
                  className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-[#F0C36B] hover:text-[#17100C] text-[#F0C36B] border border-[#F0C36B]/35 hover:border-[#F0C36B] flex items-center justify-center transition-all active:scale-90 cursor-pointer shrink-0 shadow-sm"
                  title={`Add ${dish.name} to Cart`}
                  aria-label={`Add ${dish.name} to Cart`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Right Full Menu Link */}
          <Link
            href="/menu"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-[#F0C36B]/15 border border-[#F0C36B]/30 hover:border-[#F0C36B] text-[11px] font-semibold text-[#F0C36B] hover:text-[#FFE3A5] transition-all group shrink-0 ml-auto shadow-sm backdrop-blur-md"
          >
            <span>Full Menu</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
