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
    <div className="sticky top-16 z-40 bg-obsidian/90 backdrop-blur-md py-3 border-b border-white/5 transition-all">
      <div className="flex overflow-x-auto hide-scrollbar gap-3 px-4 pb-1 snap-x">
        <div className="snap-start">
          <CategoryChip
            icon="🍽️"
            label="All"
            isActive={activeCategory === 'all'}
            onClick={() => onSelectCategory('all')}
          />
        </div>
        {categories.map((category) => (
          <div key={category.id} className="snap-start">
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
