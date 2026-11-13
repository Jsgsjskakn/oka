'use client';

import { useState, useMemo, useEffect } from 'react';
import { FilterSheet, FilterState } from '@/components/menu/FilterSheet';
import { DishGrid } from '@/components/menu/DishGrid';
import { EmptyState } from '@/components/menu/EmptyState';
import type { SortOption } from '@/components/menu/SortSheet';
import { useCartStore } from '@/store/cart-store';
import { Category, DishWithCategory } from '@/lib/db/types';
import { Search, X, SlidersHorizontal, Sparkles, UtensilsCrossed } from 'lucide-react';

interface MenuClientProps {
  categories: Category[];
  initialDishes: DishWithCategory[];
  initialCategory?: string;
  initialFilter?: string;
  initialTable?: string;
  initialSearch?: string;
}

const EDITORIAL_CATEGORY_LABELS: Record<string, string> = {
  pizza: 'Wood-Fired Pizzas',
  burger: 'Artisanal Burgers',
  chinese: 'Wok & Oriental',
  starters: 'Small Plates',
  desserts: 'Patisserie & Desserts',
};

function resolveCategorySlug(categories: Category[], rawCategory?: string): string {
  if (!rawCategory || rawCategory === 'all') return 'all';
  const matched = categories.find((c) => c.id === rawCategory || c.slug === rawCategory);
  return matched?.slug || rawCategory;
}

function normalizeCollectionFilter(raw?: string): 'featured' | 'bestsellers' | null {
  if (raw === 'featured') return 'featured';
  if (raw === 'bestsellers') return 'bestsellers';
  return null;
}

function parseValidTable(raw?: string): string {
  const clean = String(raw || '').replace(/\D/g, '').slice(0, 2);
  if (!clean) return '';
  const num = Number(clean);
  return Number.isInteger(num) && num >= 1 && num <= 30 ? String(num) : '';
}

export function MenuClient({
  categories,
  initialDishes,
  initialCategory = 'all',
  initialFilter,
  initialTable,
  initialSearch = '',
}: MenuClientProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState(() =>
    resolveCategorySlug(categories, initialCategory)
  );
  const [collectionFilter, setCollectionFilter] = useState<'featured' | 'bestsellers' | null>(() =>
    normalizeCollectionFilter(initialFilter)
  );
  const storedTableNumber = useCartStore((s) => s.tableNumber);
  const setStoredTableNumber = useCartStore((s) => s.setTableNumber);
  const [isMounted, setIsMounted] = useState(false);

  const qrTableNumber = useMemo(() => parseValidTable(initialTable), [initialTable]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setActiveCategory(resolveCategorySlug(categories, initialCategory));
  }, [categories, initialCategory]);

  useEffect(() => {
    setCollectionFilter(normalizeCollectionFilter(initialFilter));
    if (initialFilter === 'popular') {
      setFilters((prev) => ({ ...prev, popularOnly: true }));
    }
  }, [initialFilter]);

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  useEffect(() => {
    if (qrTableNumber) {
      setStoredTableNumber(qrTableNumber);
    }
  }, [qrTableNumber, setStoredTableNumber]);

  const activeTableNumber = qrTableNumber || (isMounted ? storedTableNumber : '');

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim() !== '' && activeCategory !== 'all') {
      setActiveCategory('all');
    }
  };

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>(() => ({
    vegOnly: false,
    nonVegOnly: false,
    priceRange: 'all',
    popularOnly: initialFilter === 'popular',
  }));

  const [sort, setSort] = useState<SortOption>('recommended');

  // Compute live category counts accurately from loaded dishes
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialDishes.length };
    for (const d of initialDishes) {
      const catSlug = d.categories?.slug || 'other';
      counts[catSlug] = (counts[catSlug] ?? 0) + 1;
    }
    return counts;
  }, [initialDishes]);

  // Dynamic editorial category tabs (no hardcoded counts or stale defaults)
  const categoryTabs = useMemo(() => {
    const activeSlugs = categories
      .filter((c) => c.is_active !== false && (categoryCounts[c.slug] ?? 0) > 0)
      .map((c) => ({
        id: c.slug,
        label: EDITORIAL_CATEGORY_LABELS[c.slug] || c.name,
        count: categoryCounts[c.slug] ?? 0,
      }));

    if (activeSlugs.length === 0) {
      const seen = new Set<string>();
      for (const dish of initialDishes) {
        const slug = dish.categories?.slug;
        if (slug && !seen.has(slug)) {
          seen.add(slug);
          activeSlugs.push({
            id: slug,
            label: EDITORIAL_CATEGORY_LABELS[slug] || dish.categories?.name || slug,
            count: categoryCounts[slug] ?? 0,
          });
        }
      }
    }

    return [
      { id: 'all', label: 'All Creations', count: categoryCounts['all'] ?? 0 },
      ...activeSlugs,
    ];
  }, [categories, categoryCounts, initialDishes]);

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

    // 3. UI & Deep-Link Filters
    if (collectionFilter === 'featured') {
      result = result.filter((d) => d.is_featured);
    } else if (collectionFilter === 'bestsellers') {
      result = result.filter((d) => d.is_best_seller);
    }
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
  }, [searchQuery, activeCategory, collectionFilter, filters, sort, initialDishes, categories]);

  const clearFilters = () => {
    setSearchQuery('');
    setCollectionFilter(null);
    setFilters({ vegOnly: false, nonVegOnly: false, priceRange: 'all', popularOnly: false });
    setSort('recommended');
    setActiveCategory('all');
  };

  let activeFilterCount = 0;
  if (activeCategory !== 'all') activeFilterCount++;
  if (collectionFilter) activeFilterCount++;
  if (filters.vegOnly || filters.nonVegOnly) activeFilterCount++;
  if (filters.priceRange !== 'all') activeFilterCount++;
  if (filters.popularOnly) activeFilterCount++;
  if (sort !== 'recommended') activeFilterCount++;

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
          {/* Step 2: Unified Command Bar (Search + Quick Dietary & Filter Chips) */}
          <div className="relative z-20 bg-[#0D0A08]/90 backdrop-blur-2xl border-t border-b border-[#E2A84B]/15 py-3 px-4 sm:px-6 lg:px-8 transition-all shadow-xl">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full justify-between">
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
                      className="min-w-[36px] min-h-[36px] mr-1 flex items-center justify-center rounded-md text-[#9A9286] hover:text-[#FAF5EC] transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <kbd className="hidden sm:inline mr-2 px-1 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[9px] font-mono text-[#9A9286] pointer-events-none">
                      ⌘K
                    </kbd>
                  )}
                </div>

                {/* Horizontal Quick Filter & Options Row */}
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-0.5 shrink-0">
                  {/* Tactile Dietary Switches: Veg Only */}
                  <button
                    type="button"
                    onClick={() =>
                      setFilters((f) => ({ ...f, vegOnly: !f.vegOnly, nonVegOnly: false }))
                    }
                    className={`min-h-[40px] flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 border ${
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
                    className={`min-h-[40px] flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 border ${
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

                  {/* Chef's Picks */}
                  <button
                    type="button"
                    onClick={() =>
                      setFilters((f) => ({ ...f, popularOnly: !f.popularOnly }))
                    }
                    className={`min-h-[40px] flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 border ${
                      filters.popularOnly
                        ? 'bg-[#E2A84B]/20 border-[#E2A84B] text-[#E2A84B] shadow-[0_0_12px_rgba(226,168,75,0.25)]'
                        : 'bg-[#16120E] border-white/10 text-[#9A9286] hover:text-[#FAF5EC]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#E2A84B]" />
                    <span>Chef&apos;s Picks</span>
                  </button>

                  {/* Unified Filters Trigger (Includes Sorting per user request) */}
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(true)}
                    className={`min-h-[40px] px-3.5 rounded-[6px] flex items-center justify-center gap-1.5 text-xs font-semibold whitespace-nowrap transition-all active:scale-95 border ${
                      activeFilterCount > 0
                        ? 'bg-[#E2A84B]/20 border-[#E2A84B] text-[#FAF5EC] shadow-[0_0_12px_rgba(226,168,75,0.2)]'
                        : 'bg-[#16120E] border-white/10 hover:border-[#E2A84B]/40 text-[#FAF5EC] hover:text-[#E2A84B]'
                    }`}
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

          {/* Active QR Table Dining Banner */}
          {activeTableNumber && (
            <div className="pt-3 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0E1F18] border border-[#E2A84B]/35 text-xs text-[#FAF5EC]">
                <UtensilsCrossed className="w-3.5 h-3.5 text-[#E2A84B] shrink-0" />
                <span>
                  Dining at <strong className="text-[#E2A84B]">Table #{activeTableNumber}</strong> · Auto-linked to checkout
                </span>
              </div>
            </div>
          )}

          {/* Active Filter Indicators Bar */}
          {(searchQuery || activeCategory !== 'all' || collectionFilter || filters.vegOnly || filters.nonVegOnly || filters.popularOnly || filters.priceRange !== 'all' || sort !== 'recommended') && (
            <div className="pt-3 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-[#9A9286]">
              <div className="flex items-center gap-2 flex-wrap">
                <span>
                  {activeCategory !== 'all' ? (
                    <span className="text-[#FAF5EC] font-medium">
                      Category: <span className="text-[#E2A84B] font-semibold">{categoryTabs.find((c) => c.id === activeCategory)?.label || activeCategory}</span> · 
                    </span>
                  ) : null}
                  {collectionFilter ? (
                    <span className="text-[#FAF5EC] font-medium">
                      Collection: <span className="text-[#E2A84B] font-semibold">{collectionFilter === 'featured' ? 'Featured' : 'Best Sellers'}</span> · 
                    </span>
                  ) : null}
                  Showing results for current filters ({filteredAndSortedDishes.length} items)
                </span>
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="min-h-[36px] px-2 -mr-2 text-[#E2A84B] hover:underline font-semibold"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Dish Grid Showcase */}
          <div className="pt-4 sm:pt-6">
            {filteredAndSortedDishes.length > 0 ? (
              <DishGrid dishes={filteredAndSortedDishes} searchHighlight={searchQuery} />
            ) : (
              <EmptyState onClearFilters={clearFilters} searchQuery={searchQuery} />
            )}
          </div>
        </div>
      </div>

      {/* Filter Bottom Sheet with Integrated Categories & Sorting */}
      <FilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={(f) => {
          setFilters(f);
          if (!f.vegOnly && !f.nonVegOnly && !f.popularOnly && f.priceRange === 'all') {
            setCollectionFilter(null);
          }
        }}
        currentSort={sort}
        onSelectSort={(s) => setSort(s)}
        categories={categoryTabs}
        activeCategory={activeCategory}
        onSelectCategory={(c) => setActiveCategory(c)}
      />
    </div>
  );
}
