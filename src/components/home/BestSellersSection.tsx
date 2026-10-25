'use client';

import { VerticalDishCard } from './VerticalDishCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DishWithCategory, toRupees } from '@/lib/db/types';
import { Flame } from 'lucide-react';
import type { Dish, DishCategory, SpiceLevel } from '@/types/menu';

interface BestSellersSectionProps {
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

export function BestSellersSection({ dishes }: BestSellersSectionProps) {
  return (
    <section className="py-6 bg-[#0a0a0a]">
      <div className="flex items-end justify-between mb-6 px-4">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary mb-1 flex items-center gap-2">
            Best Sellers <Flame className="w-5 h-5 text-orange-500" />
          </h2>
          <div className="w-1/2 h-[2px] bg-gradient-to-r from-orange-500 to-transparent rounded-full mt-1"></div>
        </div>
        <a href="/menu?filter=bestsellers" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          View All
        </a>
      </div>
      
      <div className="flex overflow-x-auto hide-scrollbar gap-4 px-4 pb-4 snap-x">
        {dishes.map((dish, index) => (
          <div key={dish.id} className="snap-start relative">
            <VerticalDishCard dish={adaptDish(dish)} rank={index + 1} />
          </div>
        ))}
      </div>
    </section>
  );
}
