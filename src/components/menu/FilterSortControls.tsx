'use client';

import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import type { FilterState } from './FilterSheet';
import type { SortOption } from './SortSheet';

interface FilterSortControlsProps {
  filters: FilterState;
  currentSort: SortOption;
  onOpenFilter: () => void;
  onOpenSort: () => void;
}

export function FilterSortControls({ filters, currentSort, onOpenFilter, onOpenSort }: FilterSortControlsProps) {
  // Count active filters
  let activeFilterCount = 0;
  if (filters.vegOnly || filters.nonVegOnly) activeFilterCount++;
  if (filters.priceRange !== 'all') activeFilterCount++;
  if (filters.popularOnly) activeFilterCount++;

  return (
    <div className="px-4 mb-6 flex gap-3">
      <button 
        onClick={onOpenFilter}
        className="flex-1 h-10 rounded-xl bg-[#1a1a1a] border border-border-subtle flex items-center justify-center gap-2 text-sm text-text-primary hover:bg-white/5 transition-colors relative"
      >
        <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
        Filters
        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-champagne text-black text-[10px] font-bold flex items-center justify-center border border-[#1a1a1a]">
            {activeFilterCount}
          </span>
        )}
      </button>

      <button 
        onClick={onOpenSort}
        className="flex-1 h-10 rounded-xl bg-[#1a1a1a] border border-border-subtle flex items-center justify-center gap-2 text-sm text-text-primary hover:bg-white/5 transition-colors"
      >
        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
        Sort
        {currentSort !== 'recommended' && (
          <span className="w-1.5 h-1.5 rounded-full bg-champagne ml-1" />
        )}
      </button>
    </div>
  );
}
