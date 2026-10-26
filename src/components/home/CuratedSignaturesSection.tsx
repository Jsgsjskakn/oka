'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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
  // Category tabs: All Signatures · Wood-Fired Pizzas · Artisanal Burgers · Wok & Oriental · Small Plates
  const tabs = [
    { id: 'all', label: `All Signatures (${dishes.length > 0 ? dishes.length : 24})`, filterSlug: 'all' },
    { id: 'pizzas', label: 'Wood-Fired Pizzas', filterSlug: 'pizza' },
    { id: 'burgers', label: 'Artisanal Burgers', filterSlug: 'burger' },
    { id: 'oriental', label: 'Wok & Oriental', filterSlug: 'chinese' },
    { id: 'starters', label: 'Small Plates', filterSlug: 'starters' },
  ];

  const [activeTab, setActiveTab] = useState('all');

  const getFilteredDishes = (): DishWithCategory[] => {
    if (activeTab === 'all') {
      // Pick a diverse culinary showcase across categories
      const pizza = dishes.find((d) => d.slug === 'tandoori-paneer-pizza') || dishes.find((d) => d.categories?.slug === 'pizza');
      const burger = dishes.find((d) => d.slug === 'golden-oak-signature-burger' || d.slug === 'classic-smash-burger') || dishes.find((d) => d.categories?.slug === 'burger');
      const chickenPizza = dishes.find((d) => d.slug === 'chicken-tikka-pizza');
      const orientalOrStarter = dishes.find((d) => d.slug === 'golden-chilli-potato' || d.slug === 'dynamite-chilli-potatoes' || d.slug === 'hakka-street-chow-mein' || d.slug === 'wok-tossed-chow-mein');

      const curated = [pizza, burger, chickenPizza, orientalOrStarter].filter(Boolean) as DishWithCategory[];
      if (curated.length === 4) return curated;
      return dishes.slice(0, 4);
    }

    const filtered = dishes.filter((d) => {
      const catSlug = d.categories?.slug?.toLowerCase() || '';
      const target = tabs.find((t) => t.id === activeTab)?.filterSlug || '';
      return (
        catSlug.includes(target) ||
        (target === 'starters' && (catSlug.includes('appetizer') || catSlug.includes('starter')))
      );
    });

    return filtered.length > 0 ? filtered : dishes;
  };

  const displayDishes = getFilteredDishes().slice(0, 4);

  return (
    <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto w-full">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#E0532B] font-semibold">
              ARTISANAL SELECTION
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#FAF5EC] tracking-tight">
            Chef&apos;s Curated Signatures
          </h2>
        </div>

        <Link
          href="/menu"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] font-medium text-[#E2A84B] hover:text-[#FAF5EC] transition-colors"
        >
          <span>Explore Complete Menu</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Architectural Tab Bar without emojis or pill shapes */}
      <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto hide-scrollbar mb-8 pb-3 border-b border-white/[0.06]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="relative pb-2 text-sm whitespace-nowrap transition-colors group flex flex-col items-center"
            >
              <span
                className={`font-medium transition-colors ${
                  isActive
                    ? 'text-[#E2A84B] font-semibold'
                    : 'text-[#9A9286] hover:text-[#FAF5EC]'
                }`}
              >
                {tab.label}
              </span>

              {/* Sliding 2px Gold Underline */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E2A84B] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* 4-Card Signature Culinary Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
