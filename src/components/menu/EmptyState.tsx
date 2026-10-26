'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Plus, Check, RotateCcw, Box } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { toast } from '@/store/toast-store';
import { resolveDishImageUrl } from '@/lib/utils/dish-images';

interface EmptyStateProps {
  onClearFilters: () => void;
  searchQuery?: string;
}

export function EmptyState({ onClearFilters, searchQuery }: EmptyStateProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [isAdded, setIsAdded] = useState(false);

  const recommendedDish = {
    id: 'mushroom-truffle-pizza',
    slug: 'mushroom-truffle-pizza',
    name: 'Mushroom Truffle Pizza',
    description:
      'Wild mushroom medley with black truffle oil, aged parmesan, fresh thyme, and buffalo mozzarella on our signature 48-hour fermented sourdough crust.',
    price: 549,
    image: resolveDishImageUrl('mushroom-truffle-pizza'),
    category: 'pizza' as const,
    isVeg: true,
    isAvailable: true,
    isFeatured: true,
    isBestSeller: true,
    spiceLevel: 'mild' as const,
    has3DModel: true,
  };

  const handleAddRecommendation = () => {
    addItem(recommendedDish, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1600);
    toast.success('Chef’s Recommendation Added', `${recommendedDish.name} (₹${recommendedDish.price})`);
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 max-w-3xl mx-auto text-center">
      {/* Overline & Heading */}
      <div className="space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E2A84B]/10 border border-[#E2A84B]/20 text-[#E2A84B] text-[10px] tracking-[0.25em] uppercase font-bold">
          <Sparkles className="w-3 h-3 text-[#E2A84B]" />
          <span>Chef Concierge Recommendation</span>
        </div>
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF5EC]">
          No Exact Match Found {searchQuery ? `for “${searchQuery}”` : 'in Seasonal Archive'}
        </h3>
        <p className="text-xs sm:text-sm text-[#A6A095] max-w-lg mx-auto font-light leading-relaxed">
          The requested flavour profile is currently beyond today&apos;s pantry. Allow our Executive Chef to recommend our most acclaimed table-side creation:
        </p>
      </div>

      {/* Luxury Chef Recommendation Card */}
      <div
        className="w-full max-w-xl rounded-2xl border p-5 sm:p-6 text-left relative overflow-hidden shadow-2xl transition-all duration-300 hover:border-[#E2A84B]/40"
        style={{
          background: 'linear-gradient(145deg, #181310 0%, #120E0B 100%)',
          borderColor: 'rgba(226, 168, 75, 0.28)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
        }}
      >
        <div className="flex flex-col sm:flex-row gap-5 items-center">
          {/* Dish Image */}
          <div className="relative w-full sm:w-44 aspect-square rounded-xl overflow-hidden shrink-0 bg-black/60 border border-white/10">
            <Image
              src={recommendedDish.image}
              alt={recommendedDish.name}
              fill
              className="object-cover"
              sizes="176px"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] font-bold text-[#E2A84B] border border-[#E2A84B]/30 uppercase">
              Chef&apos;s Pick
            </div>
          </div>

          {/* Dish Details */}
          <div className="flex-1 flex flex-col justify-between space-y-3 w-full">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wider text-[#E2A84B] font-bold">
                  Wood-Fired Sourdough
                </span>
                <span className="font-mono text-base font-bold text-[#FAF5EC]">
                  ₹{recommendedDish.price}
                </span>
              </div>
              <h4 className="font-serif text-lg sm:text-xl font-bold text-[#FAF5EC] mt-0.5">
                {recommendedDish.name}
              </h4>
              <p className="text-xs text-[#A6A095] font-light leading-relaxed line-clamp-2 mt-1">
                {recommendedDish.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleAddRecommendation}
                className="flex-1 min-w-[160px] py-2.5 px-4 rounded-[6px] text-[#0D0A08] font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                style={{
                  background: isAdded
                    ? '#22C58B'
                    : 'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                }}
              >
                {isAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Added to Order ✓</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add Chef&apos;s Pick · ₹{recommendedDish.price}</span>
                  </>
                )}
              </button>

              <Link
                href={`/3d/${recommendedDish.slug}`}
                className="py-2.5 px-3 rounded-[6px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-[#FAF5EC] flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Box className="w-3.5 h-3.5 text-[#E2A84B]" />
                <span className="hidden sm:inline">Inspect 3D</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Filter Button */}
      <button
        type="button"
        onClick={onClearFilters}
        className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] text-xs font-medium text-[#FAF5EC] hover:text-[#E2A84B] border border-white/10 hover:border-[#E2A84B]/40 bg-[#16120E] transition-all active:scale-95 shadow-md"
      >
        <RotateCcw className="w-3.5 h-3.5 text-[#E2A84B]" />
        <span>Reset Search &amp; Display All 10 Creations</span>
      </button>
    </div>
  );
}
