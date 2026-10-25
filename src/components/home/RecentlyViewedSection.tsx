'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { History, Plus, ChevronRight } from 'lucide-react';
import { useRecentlyViewedStore } from '@/store/recently-viewed-store';
import { useCartStore } from '@/store/cart-store';
import { toast } from '@/store/toast-store';
import { formatMoney } from '@/lib/db/types';

export function RecentlyViewedSection() {
  const [isMounted, setIsMounted] = useState(false);
  const recentDishes = useRecentlyViewedStore((s) => s.recentDishes);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || recentDishes.length === 0) {
    return null;
  }

  const handleQuickAdd = (dish: any) => {
    addItem(
      {
        id: dish.id,
        slug: dish.slug,
        name: dish.name,
        description: dish.description || '',
        price: dish.price_paise / 100,
        image: dish.image_url || '/images/dishes/placeholder.jpg',
        category: dish.categories?.slug || 'pizza',
        isVeg: dish.is_veg,
        isAvailable: dish.is_available,
        isFeatured: dish.is_featured,
        isBestSeller: dish.is_best_seller,
        spiceLevel: dish.spice_level || 'mild',
        has3DModel: dish.has_3d_model,
      },
      1
    );
    toast.success('Added to Cart', `${dish.name} (${formatMoney(dish.price_paise)})`);
  };

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#d4af37]" />
          <h2 className="font-heading text-lg sm:text-xl font-bold text-white tracking-tight">
            Recently Viewed
          </h2>
        </div>
        <Link
          href="/menu"
          className="text-xs font-medium text-[#d4af37] hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>Explore All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-3 sm:gap-4 pb-2">
        {recentDishes.map((dish) => (
          <div
            key={dish.id}
            className="flex-none w-[200px] sm:w-[220px] rounded-2xl bg-[#09150d]/80 border border-white/[0.08] hover:border-white/20 transition-all p-2.5 flex flex-col group"
          >
            <Link
              href={`/menu/${dish.categories?.slug || 'all'}/${dish.slug}`}
              className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black/40 mb-2.5 block"
            >
              <Image
                src={dish.image_url || '/images/dishes/placeholder.jpg'}
                alt={dish.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 left-2 flex items-center justify-center w-3 h-3 rounded-sm bg-white p-[2px]">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    dish.is_veg ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
              </div>
            </Link>

            <Link
              href={`/menu/${dish.categories?.slug || 'all'}/${dish.slug}`}
              className="font-heading text-xs sm:text-sm font-semibold text-white truncate hover:text-[#d4af37] transition-colors"
            >
              {dish.name}
            </Link>

            <div className="mt-auto pt-2 flex items-center justify-between">
              <span className="text-xs font-bold text-[#d4af37]">
                {formatMoney(dish.price_paise)}
              </span>
              <button
                type="button"
                onClick={() => handleQuickAdd(dish)}
                aria-label={`Add ${dish.name} to cart`}
                className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#d4af37] to-[#b38936] text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-sm"
              >
                <Plus className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
