'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { VerticalDishCard } from './VerticalDishCard';
import type { DishWithCategory } from '@/lib/db/types';
import { toRupees } from '@/lib/db/types';
import type { Dish, DishCategory, SpiceLevel } from '@/types/menu';
import { resolveDishImageUrl } from '@/lib/utils/dish-images';

interface CuratedSignaturesSectionProps {
  dishes: DishWithCategory[];
}

function adaptDish(d: DishWithCategory): Dish {
  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    description: d.description || '',
    price: toRupees(d.price_paise),
    image: resolveDishImageUrl(d.slug, d.image_url),
    category: (d.categories?.slug as DishCategory) || 'pizza',
    isVeg: d.is_veg,
    isAvailable: d.is_available,
    isFeatured: d.is_featured,
    isBestSeller: d.is_best_seller,
    spiceLevel: (d.spice_level as SpiceLevel) || 'mild',
    has3DModel: d.has_3d_model,
  };
}

export function CuratedSignaturesSection({ dishes }: CuratedSignaturesSectionProps) {
  const [activeTab, setActiveTab] = useState('all');

  const pizzaCount = dishes.filter((d) => d.categories?.slug?.includes('pizza')).length;
  const burgerCount = dishes.filter((d) => d.categories?.slug?.includes('burger')).length;
  const wokCount = dishes.filter((d) => d.categories?.slug?.includes('chinese')).length;
  const starterCount = dishes.filter((d) => d.categories?.slug?.includes('starter')).length;

  const tabs = [
    { id: 'all', label: `All Signatures (${dishes.length > 0 ? dishes.length : 10})`, filterSlug: 'all' },
    { id: 'pizzas', label: `Wood-Fired Pizzas (${pizzaCount || 5})`, filterSlug: 'pizza' },
    { id: 'burgers', label: `Artisanal Burgers (${burgerCount || 3})`, filterSlug: 'burger' },
    { id: 'oriental', label: `Wok & Oriental (${wokCount || 1})`, filterSlug: 'chinese' },
    { id: 'starters', label: `Small Plates (${starterCount || 1})`, filterSlug: 'starters' },
  ];

  const getFilteredDishes = (): DishWithCategory[] => {
    if (activeTab === 'all') {
      // Curate a balanced, diverse showcase across menu categories
      const pizza =
        dishes.find((d) => d.slug === 'tandoori-paneer-pizza') ||
        dishes.find((d) => d.categories?.slug?.includes('pizza'));
      const burger =
        dishes.find((d) => d.slug === 'classic-smash-burger' || d.slug === 'golden-oak-signature-burger') ||
        dishes.find((d) => d.categories?.slug?.includes('burger'));
      const starters =
        dishes.find((d) => d.slug === 'dynamite-chilli-potatoes') ||
        dishes.find((d) => d.categories?.slug?.includes('starter'));
      const premiumPizzaOrWok =
        dishes.find((d) => d.slug === 'mushroom-truffle-pizza' || d.slug === 'chicken-tikka-pizza' || d.slug === 'wok-tossed-chow-mein');

      const curated = [pizza, burger, starters, premiumPizzaOrWok].filter(Boolean) as DishWithCategory[];
      if (curated.length === 4) return curated;

      // Deduplicated diverse fallback
      const uniqueByCat: DishWithCategory[] = [];
      const seenCats = new Set<string>();
      for (const d of dishes) {
        const cat = d.categories?.slug || 'all';
        if (!seenCats.has(cat)) {
          seenCats.add(cat);
          uniqueByCat.push(d);
        }
        if (uniqueByCat.length === 4) break;
      }
      if (uniqueByCat.length >= 4) return uniqueByCat;
      return dishes.slice(0, 4);
    }

    const target = tabs.find((t) => t.id === activeTab)?.filterSlug || '';
    const filtered = dishes.filter((d) => {
      const catSlug = d.categories?.slug?.toLowerCase() || '';
      return (
        catSlug.includes(target) ||
        (target === 'starters' && (catSlug.includes('appetizer') || catSlug.includes('starter')))
      );
    });

    return filtered.length > 0 ? filtered : dishes;
  };

  const displayDishes = getFilteredDishes().slice(0, 4);

  return (
    <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto w-full relative">
      {/* Subtle Background Glow Accent */}
      <div className="pointer-events-none absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-[#E2A84B]/04 rounded-full blur-3xl -z-10" />

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2 h-2 rounded-full bg-[#E0532B] animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#E0532B] font-bold">
              ARTISANAL SELECTION · CHEF&apos;S TABLE
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[40px] font-bold text-[#FAF5EC] tracking-tight leading-tight">
            Chef&apos;s Curated Signatures
          </h2>
        </div>

        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold text-[#E2A84B] hover:text-[#FAF5EC] transition-all group pb-1"
        >
          <span>Explore Complete Menu</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Architectural Tab Bar with Animated Underline */}
      <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto hide-scrollbar mb-10 pb-3 border-b border-white/[0.06]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="relative pb-2.5 text-sm whitespace-nowrap transition-all duration-300 group flex flex-col items-center select-none active:scale-95"
            >
              <span
                className={`transition-colors tracking-wide ${
                  isActive
                    ? 'text-[#E2A84B] font-bold'
                    : 'text-[#9A9286] font-medium hover:text-[#FAF5EC]'
                }`}
              >
                {tab.label}
              </span>

              {/* Animated 2px Gold Underline */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E2A84B] rounded-full shadow-[0_0_8px_rgba(226,168,75,0.6)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* 4-Card Luxury Signature Culinary Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {displayDishes.map((dish, index) => (
          <VerticalDishCard
            key={dish.id}
            dish={adaptDish(dish)}
            rank={index + 1}
          />
        ))}
      </div>
    </section>
  );
}
