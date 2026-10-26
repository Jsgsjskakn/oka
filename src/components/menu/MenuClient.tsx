'use client';

import { useState, useMemo } from 'react';
import { MenuHeader } from '@/components/menu/MenuHeader';
import { FilterSheet, FilterState } from '@/components/menu/FilterSheet';
import { SortSheet, SortOption } from '@/components/menu/SortSheet';
import { DishGrid } from '@/components/menu/DishGrid';
import { EmptyState } from '@/components/menu/EmptyState';
import { Category, DishWithCategory } from '@/lib/db/types';
import { Search, X, SlidersHorizontal, ArrowUpDown, Sparkles } from 'lucide-react';

interface MenuClientProps {
  categories: Category[];
  initialDishes: DishWithCategory[];
  initialCategory?: string;
}

export function MenuClient({ categories, initialDishes, initialCategory = 'all' }: MenuClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim() !== '' && activeCategory !== 'all') {
      setActiveCategory('all');
    }
  };

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    vegOnly: false,
    nonVegOnly: false,
    priceRange: 'all',
    popularOnly: false,
  });

  const [sort, setSort] = useState<SortOption>('recommended');

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialDishes.length };
    for (const d of initialDishes) {
      const catSlug = d.categories?.slug || 'other';
      counts[catSlug] = (counts[catSlug] || 0) + 1;
    }
    return counts;
  }, [initialDishes]);

  // Clean Editorial Category Tabs (NO EMOJIS)
  const categoryTabs = useMemo(() => {
    return [
      { id: 'all', label: 'All Creations', count: categoryCounts['all'] || 10 },
      { id: 'pizza', label: 'Wood-Fired Pizzas', count: categoryCounts['pizza'] || 5 },
      { id: 'burger', label: 'Artisanal Burgers', count: categoryCounts['burger'] || 3 },
      { id: 'chinese', label: 'Wok & Oriental', count: categoryCounts['chinese'] || 1 },
      { id: 'starters', label: 'Small Plates', count: categoryCounts['starters'] || 1 },
    ];
  }, [categoryCounts]);

  // Filter & Sort Logic
  const filteredAndSortedDishes = useMemo(() => {
    let result = [...initialDishes];

    // 1. Category Filter
    if (activeCategory !== 'all') {
      const activeCatSlug = categories.find((c) => c.id === activeCategory)?.slug || activeCategory;
      result = result.filter(
        (d) => d.categories?.slug === activeCatSlug || d.categories?.id === activeCategory
      );
    }

    // 2. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((d) => {
        const nameMatch = d.name.toLowerCase().includes(q);
        const descMatch = d.description?.toLowerCase().includes(q);
        const catMatch = d.categories?.name?.toLowerCase().includes(q);
        const spiceMatch = d.spice_level?.toLowerCase().includes(q);
        return nameMatch || descMatch || catMatch || spiceMatch;
      });
    }

    // 3. UI Filters
    if (filters.vegOnly) {
      result = result.filter((d) => d.is_veg);
    }
    if (filters.nonVegOnly) {
      result = result.filter((d) => !d.is_veg);
    }
    if (filters.popularOnly) {
      result = result.filter((d) => d.is_best_seller || d.is_featured);
    }

    if (filters.priceRange === 'under300') {
      result = result.filter((d) => d.price_paise < 30000);
    } else if (filters.priceRange === '300to500') {
      result = result.filter((d) => d.price_paise >= 30000 && d.price_paise <= 50000);
    } else if (filters.priceRange === 'above500') {
      result = result.filter((d) => d.price_paise > 50000);
    }

    // 4. Sort
    switch (sort) {
      case 'priceAsc':
        result.sort((a, b) => a.price_paise - b.price_paise);
        break;
      case 'priceDesc':
        result.sort((a, b) => b.price_paise - a.price_paise);
        break;
      case 'popular':
        result.sort((a, b) => {
          const aScore = (a.is_best_seller ? 2 : 0) + (a.is_featured ? 1 : 0);
          const bScore = (b.is_best_seller ? 2 : 0) + (b.is_featured ? 1 : 0);
          return bScore - aScore;
        });
        break;
      case 'recommended':
      default:
        break;
    }

    return result;
  }, [searchQuery, activeCategory, filters, sort, initialDishes, categories]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({ vegOnly: false, nonVegOnly: false, priceRange: 'all', popularOnly: false });
    setSort('recommended');
    setActiveCategory('all');
  };

  let activeFilterCount = 0;
  if (filters.vegOnly || filters.nonVegOnly) activeFilterCount++;
  if (filters.priceRange !== 'all') activeFilterCount++;
  if (filters.popularOnly) activeFilterCount++;

  return (
    <div className="relative min-h-screen bg-[#0D0A08] text-[#FAF5EC] overflow-x-hidden selection:bg-[#E2A84B] selection:text-[#0D0A08]">
      {/* Layer 2: Top Ambient Chandelier Glow (Hero Radial Spotlight) */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[650px] z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 35% at 50% 12%, rgba(226, 168, 75, 0.14) 0%, rgba(224, 83, 43, 0.04) 45%, transparent 80%)',
        }}
      />

      {/* Layer 3: Fine Paper Grain Texture (Tactile Film Noise Overlay) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Layer 4: Architectural Margin Lines (Subtle Gold Hairlines Container) */}
      <div className="max-w-[1360px] mx-auto border-l border-r border-[#E2A84B]/[0.07] min-h-screen relative z-10 flex flex-col justify-between">
        <div>
          {/* Step 1: Compact Editorial Header with smooth collapse on search focus */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isSearchFocused || searchQuery.trim()
                ? 'max-h-0 opacity-0 pointer-events-none'
                : 'max-h-[350px] opacity-100'
            }`}
          >
            <MenuHeader />
          </div>

          {/* Step 2: Unified Sticky Glass Command Bar (Navbar top: 80px sticky) */}
          <div className="sticky top-20 z-40 bg-[#0D0A08]/90 backdrop-blur-2xl border-t border-b border-[#E2A84B]/15 py-3 px-4 sm:px-6 lg:px-8 transition-all shadow-2xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Left Side: Clean Typographic Category Tabs with Superscript Counts (NO EMOJIS) */}
              <div className="flex items-center gap-6 sm:gap-7 overflow-x-auto hide-scrollbar w-full lg:w-auto pb-1 lg:pb-0">
                {categoryTabs.map((tab) => {
                  const isActive = activeCategory === tab.id;
                  const countFormatted = tab.count < 10 ? `0${tab.count}` : `${tab.count}`;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveCategory(tab.id)}
                      className="relative pb-1.5 text-xs sm:text-sm whitespace-nowrap transition-all duration-300 group flex items-baseline gap-1 select-none active:scale-95"
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
                      <sup
                        className={`text-[10px] font-mono transition-colors ${
                          isActive ? 'text-[#E2A84B] font-bold' : 'text-[#9A9286]/70'
                        }`}
                      >
                        {countFormatted}
                      </sup>

                      {/* Sliding 2px Gold Indicator */}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E2A84B] rounded-full shadow-[0_0_8px_rgba(226,168,75,0.6)]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Right Side: Expandable Search + Dietary Toggles + Sort */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto justify-between lg:justify-end">
                {/* Sleek Expandable Glass Search Input with Gold Aura Focus */}
                <div
                  className={`relative flex items-center h-9 w-full sm:w-64 focus-within:sm:w-80 transition-all duration-300 rounded-[6px] bg-[#17120E] border shadow-inner ${
                    isSearchFocused
                      ? 'border-[#E2A84B] shadow-[0_0_24px_rgba(226,168,75,0.22)]'
                      : 'border-[#E2A84B]/25 hover:border-[#E2A84B]/50'
                  }`}
                >
                  <div className="pl-3 pr-2 text-[#E2A84B]">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search dishes, ingredients, spice..."
                    aria-label="Search dishes"
                    className="flex-1 h-full bg-transparent text-xs text-[#FAF5EC] placeholder:text-[#9A9286]/60 outline-none pr-2 font-light"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => handleSearchChange('')}
                      className="pr-3 text-[#9A9286] hover:text-[#FAF5EC] transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <kbd className="hidden sm:inline mr-2 px-1 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[9px] font-mono text-[#9A9286] pointer-events-none">
                      ⌘K
                    </kbd>
                  )}
                </div>

                {/* Tactile Dietary Switches: Veg Only */}
                <button
                  type="button"
                  onClick={() =>
                    setFilters((f) => ({ ...f, vegOnly: !f.vegOnly, nonVegOnly: false }))
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all duration-200 active:scale-95 border ${
                    filters.vegOnly
                      ? 'bg-[#22C58B]/20 border-[#22C58B] text-[#22C58B] shadow-[0_0_12px_rgba(34,197,139,0.25)]'
                      : 'bg-[#16120E] border-white/10 text-[#9A9286] hover:text-[#FAF5EC]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      filters.vegOnly ? 'bg-[#22C58B]' : 'bg-[#22C58B]/50'
                    }`}
                  />
                  <span>Veg Only</span>
                </button>

                {/* Tactile Dietary Switches: Non-Veg */}
                <button
                  type="button"
                  onClick={() =>
                    setFilters((f) => ({ ...f, nonVegOnly: !f.nonVegOnly, vegOnly: false }))
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all duration-200 active:scale-95 border ${
                    filters.nonVegOnly
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                      : 'bg-[#16120E] border-white/10 text-[#9A9286] hover:text-[#FAF5EC]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      filters.nonVegOnly ? 'bg-rose-500' : 'bg-rose-500/50'
                    }`}
                  />
                  <span>Non-Veg</span>
                </button>

                {/* Chef's Picks (Replaced 🔥 Popular) */}
                <button
                  type="button"
                  onClick={() =>
                    setFilters((f) => ({ ...f, popularOnly: !f.popularOnly }))
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all duration-200 active:scale-95 border ${
                    filters.popularOnly
                      ? 'bg-[#E2A84B]/20 border-[#E2A84B] text-[#E2A84B] shadow-[0_0_12px_rgba(226,168,75,0.25)]'
                      : 'bg-[#16120E] border-white/10 text-[#9A9286] hover:text-[#FAF5EC]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#E2A84B]" />
                  <span>Chef&apos;s Picks</span>
                </button>

                {/* Sort Modal Trigger */}
                <button
                  type="button"
                  onClick={() => setIsSortOpen(true)}
                  className="h-9 px-3 rounded-[6px] bg-[#16120E] border border-white/10 hover:border-[#E2A84B]/40 flex items-center justify-center gap-1.5 text-xs font-medium text-[#FAF5EC] hover:text-[#E2A84B] transition-all"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#E2A84B]" />
                  <span>Sort</span>
                  {sort !== 'recommended' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E2A84B]" />
                  )}
                </button>

                {/* All Filters Trigger */}
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(true)}
                  className="h-9 px-3 rounded-[6px] bg-[#16120E] border border-white/10 hover:border-[#E2A84B]/40 flex items-center justify-center gap-1.5 text-xs font-medium text-[#FAF5EC] hover:text-[#E2A84B] transition-all relative"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#E2A84B]" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#E2A84B] text-[#0D0A08] text-[9px] font-extrabold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Indicators Bar */}
          {(searchQuery || filters.vegOnly || filters.nonVegOnly || filters.popularOnly || filters.priceRange !== 'all') && (
            <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto flex items-center justify-between text-xs text-[#9A9286]">
              <div className="flex items-center gap-2">
                <span>Showing results for current filters ({filteredAndSortedDishes.length} items)</span>
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="text-[#E2A84B] hover:underline font-semibold"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Dish Grid Showcase */}
          <div className="pt-8">
            {filteredAndSortedDishes.length > 0 ? (
              <DishGrid dishes={filteredAndSortedDishes} searchHighlight={searchQuery} />
            ) : (
              <EmptyState onClearFilters={clearFilters} searchQuery={searchQuery} />
            )}
          </div>
        </div>
      </div>

      {/* Filter & Sort Bottom Sheets */}
      <FilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={(f) => setFilters(f)}
      />

      <SortSheet
        isOpen={isSortOpen}
        onClose={() => setIsSortOpen(false)}
        currentSort={sort}
        onApply={(s) => setSort(s)}
      />
    </div>
  );
}
