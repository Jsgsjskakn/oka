'use client';

import { SlidersHorizontal, ArrowUpDown, Leaf, Flame, Sparkles } from 'lucide-react';
import type { FilterState } from './FilterSheet';
import type { SortOption } from './SortSheet';

interface FilterSortControlsProps {
  filters: FilterState;
  currentSort: SortOption;
  onOpenFilter: () => void;
  onOpenSort: () => void;
  onToggleVeg?: () => void;
  onToggleNonVeg?: () => void;
  onTogglePopular?: () => void;
}

export function FilterSortControls({
  filters,
  currentSort,
  onOpenFilter,
  onOpenSort,
  onToggleVeg,
  onToggleNonVeg,
  onTogglePopular,
}: FilterSortControlsProps) {
  let activeFilterCount = 0;
  if (filters.vegOnly || filters.nonVegOnly) activeFilterCount++;
  if (filters.priceRange !== 'all') activeFilterCount++;
  if (filters.popularOnly) activeFilterCount++;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 flex flex-wrap items-center justify-between gap-3">
      {/* Quick Direct Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-0.5">
        <button
          type="button"
          onClick={onToggleVeg}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            filters.vegOnly
              ? 'bg-[#3EE094]/20 border border-[#3EE094]/60 text-[#3EE094]'
              : 'bg-white/[0.04] border border-white/10 text-white/70 hover:text-white'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Veg Only</span>
        </button>

        <button
          type="button"
          onClick={onToggleNonVeg}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            filters.nonVegOnly
              ? 'bg-rose-500/20 border border-rose-500/60 text-rose-300'
              : 'bg-white/[0.04] border border-white/10 text-white/70 hover:text-white'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Non-Veg</span>
        </button>

        <button
          type="button"
          onClick={onTogglePopular}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            filters.popularOnly
              ? 'bg-[#d4af37]/20 border border-[#d4af37]/60 text-[#d4af37]'
              : 'bg-white/[0.04] border border-white/10 text-white/70 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Popular</span>
        </button>
      </div>

      {/* Filter and Sort Trigger Modals */}
      <div className="flex items-center gap-2.5 ml-auto">
        <button
          type="button"
          onClick={onOpenFilter}
          className="h-9 px-3.5 rounded-xl bg-[#09150d]/80 border border-white/10 hover:border-white/25 flex items-center justify-center gap-2 text-xs font-medium text-white/85 hover:text-white transition-all relative"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>All Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#d4af37] text-black text-[9px] font-extrabold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenSort}
          className="h-9 px-3.5 rounded-xl bg-[#09150d]/80 border border-white/10 hover:border-white/25 flex items-center justify-center gap-2 text-xs font-medium text-white/85 hover:text-white transition-all"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Sort</span>
          {currentSort !== 'recommended' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
          )}
        </button>
      </div>
    </div>
  );
}
