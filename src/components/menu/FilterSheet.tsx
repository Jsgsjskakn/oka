'use client';

import { X, ArrowUpDown, Check, Sparkles, Layers } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { useSheetModal } from './useSheetModal';
import type { SortOption } from './SortSheet';

export type FilterState = {
  vegOnly: boolean;
  nonVegOnly: boolean;
  priceRange: 'all' | 'under300' | '300to500' | 'above500';
  popularOnly: boolean;
};

export type CategoryOption = {
  id: string;
  label: string;
  count?: number;
};

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  currentSort?: SortOption;
  onSelectSort?: (sort: SortOption) => void;
  categories?: CategoryOption[];
  activeCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
}

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'priceAsc', label: 'Price: Low to High' },
  { id: 'priceDesc', label: 'Price: High to Low' },
  { id: 'popular', label: 'Popular / Chef Picks' },
];

export function FilterSheet({
  isOpen,
  onClose,
  filters,
  onApply,
  currentSort = 'recommended',
  onSelectSort,
  categories = [],
  activeCategory = 'all',
  onSelectCategory,
}: FilterSheetProps) {
  useSheetModal(isOpen, onClose);

  if (!isOpen) return null;

  const handleClearAll = () => {
    onApply({
      vegOnly: false,
      nonVegOnly: false,
      priceRange: 'all',
      popularOnly: false,
    });
    if (onSelectSort) {
      onSelectSort('recommended');
    }
    if (onSelectCategory) {
      onSelectCategory('all');
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[70] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters and Categories"
        className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-xl sm:w-full bg-[#0E0A08] rounded-t-3xl sm:rounded-3xl z-[70] border-t sm:border border-[#E2A84B]/30 p-4 sm:p-5 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-5 max-h-[90dvh] sm:max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 sm:fade-in duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] sm:shadow-[0_24px_70px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#FAF5EC]">Filters &amp; Categories</h2>
            <span className="text-[9.5px] tracking-wider uppercase font-mono px-2 py-0.5 rounded bg-[#E2A84B]/15 text-[#E2A84B] font-semibold">
              Menu Options
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="w-11 h-11 -mr-1.5 rounded-full bg-white/5 flex items-center justify-center text-[#9A9286] hover:text-[#FAF5EC] hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 flex-1 min-h-0 overflow-y-auto no-scrollbar pr-0.5">
          {/* Section 1: Culinary Categories */}
          {categories.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-[10.5px] font-semibold uppercase tracking-wider text-[#FAF5EC]/80 flex items-center gap-1 font-mono">
                  <Layers className="w-3 h-3 text-[#E2A84B]" />
                  <span>Culinary Category</span>
                </h3>
                {activeCategory !== 'all' && onSelectCategory && (
                  <button
                    type="button"
                    onClick={() => onSelectCategory('all')}
                    className="text-[10px] text-[#E2A84B] hover:underline"
                  >
                    View All
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {categories.map((cat) => {
                  const isSelected = activeCategory === cat.id;
                  const countFormatted =
                    cat.count !== undefined
                      ? cat.count < 10
                        ? `0${cat.count}`
                        : `${cat.count}`
                      : null;
                  return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                        className={`min-h-[40px] flex items-center justify-between px-2.5 py-2 rounded-lg text-[11px] transition-all text-left border ${
                          isSelected
                            ? 'bg-[#E2A84B]/20 border-[#E2A84B] text-[#FAF5EC] shadow-[0_0_10px_rgba(226,168,75,0.2)] font-semibold'
                            : 'bg-white/[0.03] border-white/10 text-[#9A9286] hover:text-[#FAF5EC] hover:bg-white/[0.06]'
                        }`}
                      >
                      <span className="truncate">{cat.label}</span>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {countFormatted && (
                          <span
                            className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                              isSelected
                                ? 'bg-[#E2A84B] text-black font-bold'
                                : 'bg-white/5 text-[#9A9286]'
                            }`}
                          >
                            {countFormatted}
                          </span>
                        )}
                        {isSelected && <Check className="w-3 h-3 text-[#E2A84B]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Sort By */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-[10.5px] font-semibold uppercase tracking-wider text-[#FAF5EC]/80 flex items-center gap-1 font-mono">
                <ArrowUpDown className="w-3 h-3 text-[#E2A84B]" />
                <span>Sort By</span>
              </h3>
              {currentSort !== 'recommended' && onSelectSort && (
                <button
                  type="button"
                  onClick={() => onSelectSort('recommended')}
                  className="text-[10px] text-[#E2A84B] hover:underline"
                >
                  Reset Sort
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {SORT_OPTIONS.map((option) => {
                const isSelected = currentSort === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onSelectSort && onSelectSort(option.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left border ${
                      isSelected
                        ? 'bg-[#E2A84B]/20 border-[#E2A84B] text-[#FAF5EC] shadow-[0_0_10px_rgba(226,168,75,0.2)] font-semibold'
                        : 'bg-white/[0.03] border-white/10 text-[#9A9286] hover:text-[#FAF5EC] hover:bg-white/[0.06]'
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check className="w-3 h-3 text-[#E2A84B] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Dietary Preferences */}
          <div>
            <h3 className="text-[10.5px] font-semibold uppercase tracking-wider text-[#FAF5EC]/80 mb-1.5 font-mono">
              Dietary Preference
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              <button 
                type="button"
                onClick={() => onApply({ ...filters, vegOnly: !filters.vegOnly, nonVegOnly: false })}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] border transition-all ${
                  filters.vegOnly 
                    ? 'bg-[#22C58B]/20 border-[#22C58B] text-[#22C58B] shadow-[0_0_10px_rgba(34,197,139,0.2)] font-semibold' 
                    : 'bg-white/[0.03] border-white/10 text-[#9A9286] hover:text-[#FAF5EC] hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C58B]" />
                  <span>Vegetarian Only</span>
                </div>
                {filters.vegOnly && <Check className="w-3 h-3 text-[#22C58B] shrink-0" />}
              </button>

              <button 
                type="button"
                onClick={() => onApply({ ...filters, nonVegOnly: !filters.nonVegOnly, vegOnly: false })}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] border transition-all ${
                  filters.nonVegOnly 
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)] font-semibold' 
                    : 'bg-white/[0.03] border-white/10 text-[#9A9286] hover:text-[#FAF5EC] hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Non-Vegetarian</span>
                </div>
                {filters.nonVegOnly && <Check className="w-3 h-3 text-rose-300 shrink-0" />}
              </button>
            </div>
          </div>

          {/* Section 4: Price Range */}
          <div>
            <h3 className="text-[10.5px] font-semibold uppercase tracking-wider text-[#FAF5EC]/80 mb-1.5 font-mono">
              Price Range
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'all', label: 'Any Price' },
                { id: 'under300', label: '< ₹300' },
                { id: '300to500', label: '₹300 - 500' },
                { id: 'above500', label: '> ₹500' },
              ].map((range) => {
                const isSelected = filters.priceRange === range.id;
                return (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => onApply({ ...filters, priceRange: range.id as FilterState['priceRange'] })}
                    className={`min-h-[40px] px-2.5 py-2 rounded-lg text-[11px] border transition-all text-center whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#E2A84B]/20 border-[#E2A84B] text-[#FAF5EC] shadow-[0_0_8px_rgba(226,168,75,0.2)] font-semibold'
                        : 'bg-white/[0.03] border-white/10 text-[#9A9286] hover:text-[#FAF5EC] hover:bg-white/[0.06]'
                    }`}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Chef Highlights */}
          <div>
            <button 
              type="button"
              onClick={() => onApply({ ...filters, popularOnly: !filters.popularOnly })}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] border transition-all ${
                filters.popularOnly 
                  ? 'bg-[#E2A84B]/20 border-[#E2A84B] text-[#E2A84B] shadow-[0_0_10px_rgba(226,168,75,0.25)] font-semibold' 
                  : 'bg-white/[0.03] border-white/10 text-[#9A9286] hover:text-[#FAF5EC] hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#E2A84B]" />
                <span>Chef&apos;s Signature Picks Only</span>
              </div>
              {filters.popularOnly && <Check className="w-3 h-3 text-[#E2A84B] shrink-0" />}
            </button>
          </div>
        </div>

        {/* Action Buttons: always visible in view without scrolling */}
        <div className="flex gap-2.5 mt-3 pt-2.5 border-t border-white/[0.08] shrink-0">
          <SecondaryButton 
            className="flex-1 min-h-[44px] py-2 text-xs"
            onClick={handleClearAll}
          >
            Clear All
          </SecondaryButton>
          <PrimaryButton className="flex-1 min-h-[44px] py-2 text-xs" onClick={onClose}>
            Apply Filters
          </PrimaryButton>
        </div>
      </div>
    </>
  );
}
