'use client';

import { CategoryChip } from '@/components/ui/CategoryChip';
import { Category } from '@/lib/db/types';

interface CategoryPillsProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (id: string) => void;
}

export function CategoryPills({ categories, activeCategory, onSelectCategory }: CategoryPillsProps) {
  return (
    <div className="sticky top-16 z-40 bg-[#060e08]/90 backdrop-blur-xl py-3 border-b border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto flex overflow-x-auto hide-scrollbar gap-2.5 sm:gap-3 px-4 sm:px-6 lg:px-8 pb-1 snap-x">
        <div className="snap-start shrink-0">
          <CategoryChip
            icon="🍽️"
            label="All Dishes"
            isActive={activeCategory === 'all'}
            onClick={() => onSelectCategory('all')}
          />
        </div>
        {categories.map((category) => (
          <div key={category.id} className="snap-start shrink-0">
            <CategoryChip
              icon={category.icon || '🍽️'}
              label={category.name}
              isActive={activeCategory === category.id}
              onClick={() => onSelectCategory(category.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
