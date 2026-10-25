'use client';

import { useState, useMemo } from 'react';
import { MenuHeader } from '@/components/menu/MenuHeader';
import { SearchBar } from '@/components/menu/SearchBar';
import { CategoryPills } from '@/components/menu/CategoryPills';
import { FilterSortControls } from '@/components/menu/FilterSortControls';
import { FilterSheet, FilterState } from '@/components/menu/FilterSheet';
import { SortSheet, SortOption } from '@/components/menu/SortSheet';
import { DishGrid } from '@/components/menu/DishGrid';
import { EmptyState } from '@/components/menu/EmptyState';
import { Category, DishWithCategory } from '@/lib/db/types';

interface MenuClientProps {
  categories: Category[];
  initialDishes: DishWithCategory[];
  initialCategory?: string;
}

export function MenuClient({ categories, initialDishes, initialCategory = 'all' }: MenuClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredAndSortedDishes = useMemo(() => {
    let result = [...initialDishes];

    // 1. Category Filter
    if (activeCategory !== 'all') {
      const activeCatSlug = categories.find((c) => c.id === activeCategory)?.slug || activeCategory;
      result = result.filter(
        (d) => d.categories?.slug === activeCatSlug || d.categories?.id === activeCategory
      );
    }

    // 2. Search Filter (Feature A: Smart Search over name, description, ingredients, spice)
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

  return (
    <div className="flex flex-col min-h-screen bg-[#060e08] text-white">
      <MenuHeader />

      <SearchBar value={searchQuery} onChange={handleSearchChange} />

      <CategoryPills
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      <div className="pt-6">
        <FilterSortControls
          filters={filters}
          currentSort={sort}
          onOpenFilter={() => setIsFilterOpen(true)}
          onOpenSort={() => setIsSortOpen(true)}
          onToggleVeg={() =>
            setFilters((f) => ({ ...f, vegOnly: !f.vegOnly, nonVegOnly: false }))
          }
          onToggleNonVeg={() =>
            setFilters((f) => ({ ...f, nonVegOnly: !f.nonVegOnly, vegOnly: false }))
          }
          onTogglePopular={() =>
            setFilters((f) => ({ ...f, popularOnly: !f.popularOnly }))
          }
        />

        {filteredAndSortedDishes.length > 0 ? (
          <DishGrid dishes={filteredAndSortedDishes} />
        ) : (
          <EmptyState onClearFilters={clearFilters} />
        )}
      </div>

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
