'use client';

import { CategoryChip } from '@/components/ui/CategoryChip';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Category } from '@/lib/db/types';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CategoriesSectionProps {
  categories: Category[];
}

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const router = useRouter();

  return (
    <section className="py-6">
      <SectionHeader title="Explore Menu" />
      
      <div className="flex overflow-x-auto hide-scrollbar gap-3 px-4 pb-4 snap-x">
        <div className="snap-start">
          <CategoryChip 
            icon="🍽️" 
            label="All" 
            isActive={activeCategory === 'all'}
            onClick={() => {
              setActiveCategory('all');
              router.push('/menu');
            }}
          />
        </div>
        {categories.map((category) => (
          <div key={category.id} className="snap-start">
            <CategoryChip
              icon={category.icon || '🍽️'}
              label={category.name}
              isActive={activeCategory === category.id}
              onClick={() => {
                setActiveCategory(category.id);
                router.push(`/menu/${category.slug}`);
              }}
            />
          </div>
        ))}
        <div className="snap-start">
          <CategoryChip
            icon="↗️"
            label="View All"
            isActive={false}
            onClick={() => router.push('/menu')}
          />
        </div>
      </div>
    </section>
  );
}
