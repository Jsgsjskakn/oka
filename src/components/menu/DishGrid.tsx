'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { MenuDishCard } from './MenuDishCard';
import { DishWithCategory } from '@/lib/db/types';

interface DishGridProps {
  dishes: DishWithCategory[];
  searchHighlight?: string;
}

export function DishGrid({ dishes, searchHighlight }: DishGridProps) {
  const showConciergeCard = dishes.length === 10;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 sm:px-6 lg:px-8 pb-20 max-w-[1360px] mx-auto w-full items-stretch">
      {dishes.map((dish) => (
        <MenuDishCard key={dish.id} dish={dish} searchHighlight={searchHighlight} />
      ))}

      {/* Concierge VIP Degustation & Private Dining Card (Fills Grid Hole seamlessly on full menu view) */}
      {showConciergeCard && (
        <div
          className="col-span-1 sm:col-span-2 rounded-2xl p-6 sm:p-8 flex flex-col justify-between border relative overflow-hidden group shadow-2xl transition-all duration-300 hover:border-[#E2A84B]/40"
          style={{
            background: 'linear-gradient(135deg, #181310 0%, #120E0B 100%)',
            borderColor: 'rgba(226, 168, 75, 0.28)',
          }}
        >
          {/* Subtle gold ambient glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 w-44 h-44 bg-[#E2A84B]/10 rounded-full blur-2xl group-hover:bg-[#E2A84B]/15 transition-all" />

          <div className="space-y-3 relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E0532B] animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#E0532B] font-bold">
                PRIVATE TASTING &amp; BESPOKE DINING
              </span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF5EC] leading-snug">
              Curate Your Custom Multi-Course Chef&apos;s Menu
            </h3>

            <p className="text-xs sm:text-sm text-[#A6A095] font-light leading-relaxed max-w-lg">
              Hosting a private celebration or corporate dinner? Our executive culinary team and master sommelier craft tailored multi-course degustations with rare reserve cellar pairings.
            </p>
          </div>

          <div className="pt-6 mt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <span className="text-xs font-serif italic text-[#E2A84B] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E2A84B]" />
              <span>Complimentary Valet &amp; Sommelier Pairings</span>
            </span>

            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[6px] text-xs font-bold text-[#0D0A08] transition-all hover:brightness-110 active:scale-95 shadow-md shrink-0"
              style={{
                background: 'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
              }}
            >
              <span>Reserve Private Dining</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
