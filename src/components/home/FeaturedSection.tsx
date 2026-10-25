'use client';

import { DishCard } from '@/components/ui/DishCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DishWithCategory, toRupees } from '@/lib/db/types';
import type { Dish, DishCategory, SpiceLevel } from '@/types/menu';

interface FeaturedSectionProps {
  dishes: DishWithCategory[];
}

function adaptDish(d: DishWithCategory): Dish {
  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    description: d.description || '',
    price: toRupees(d.price_paise),
    image: d.image_url || '',
    category: (d.categories?.slug as DishCategory) || 'pizza',
    isVeg: d.is_veg,
    isAvailable: d.is_available,
    isFeatured: d.is_featured,
    isBestSeller: d.is_best_seller,
    spiceLevel: (d.spice_level as SpiceLevel) || 'mild',
    has3DModel: d.has_3d_model,
  };
}

export function FeaturedSection({ dishes }: FeaturedSectionProps) {
  return (
    <section className="py-6">
      <SectionHeader title="Featured Dishes" viewAllLink="/menu?filter=featured" />
      
      <div className="flex overflow-x-auto hide-scrollbar gap-4 px-4 pb-4 snap-x">
        {dishes.slice(0, 3).map((dish) => (
          <div key={dish.id} className="snap-start">
            <DishCard dish={adaptDish(dish)} />
          </div>
        ))}
      </div>
    </section>
  );
}
