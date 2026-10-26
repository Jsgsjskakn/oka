'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, History, ArrowRight } from 'lucide-react';
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
    <section className="px-6 md:px-12 max-w-7xl mx-auto w-full pt-6">
      {/* Continue Exploring Bar: Horizontal Compact Strip (height: 72px, #17120F surface) */}
      <div
        className="w-full min-h-[72px] px-5 py-3 rounded-xl flex flex-wrap md:flex-nowrap items-center justify-between gap-4 border"
        style={{
          background: '#17120F',
          borderColor: 'rgba(226, 168, 75, 0.2)',
        }}
      >
        {/* Left Label */}
        <div className="flex items-center gap-2.5 shrink-0">
          <History className="w-4 h-4 text-[#E2A84B]" />
          <span className="text-xs uppercase tracking-[0.2em] text-[#9A9286] font-medium">
            CONTINUE EXPLORING
          </span>
        </div>

        {/* Horizontal Row of Recent Dishes */}
        <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar py-1 flex-1">
          {recentDishes.slice(0, 3).map((dish) => (
            <div
              key={dish.id}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-lg bg-white/[0.03] border border-white/[0.06] shrink-0 group hover:border-[#E2A84B]/40 transition-colors"
            >
              {/* 52x52px square thumbnail */}
              <Link
                href={`/menu/${dish.categories?.slug || 'all'}/${dish.slug}`}
                className="relative w-[52px] h-[52px] rounded-md overflow-hidden bg-black/50 shrink-0"
              >
                <Image
                  src={dish.image_url || '/images/dishes/placeholder.jpg'}
                  alt={dish.name}
                  fill
                  sizes="52px"
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </Link>

              {/* Title & Price */}
              <div className="flex flex-col min-w-0 pr-2">
                <Link
                  href={`/menu/${dish.categories?.slug || 'all'}/${dish.slug}`}
                  className="font-serif text-sm font-semibold text-[#FAF5EC] truncate group-hover:text-[#E2A84B] transition-colors"
                >
                  {dish.name}
                </Link>
                <span className="font-mono text-xs font-bold text-[#E2A84B] mt-0.5">
                  {formatMoney(dish.price_paise)}
                </span>
              </div>

              {/* Quick Add + Button */}
              <button
                type="button"
                onClick={() => handleQuickAdd(dish)}
                aria-label={`Quick add ${dish.name} to cart`}
                className="w-7 h-7 rounded-[6px] bg-[#E2A84B]/15 hover:bg-[#E2A84B] border border-[#E2A84B]/40 text-[#E2A84B] hover:text-[#0D0A08] flex items-center justify-center transition-all shrink-0 ml-auto"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* View Full Menu Link */}
        <Link
          href="/menu"
          className="text-xs text-[#E2A84B] hover:text-[#FAF5EC] flex items-center gap-1 shrink-0 font-medium transition-colors"
        >
          <span>Full Menu</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
