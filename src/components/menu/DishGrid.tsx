'use client';

import { MenuDishCard } from './MenuDishCard';
import { DishWithCategory } from '@/lib/db/types';

interface DishGridProps {
  dishes: DishWithCategory[];
}

export function DishGrid({ dishes }: DishGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8 pb-16 max-w-7xl mx-auto w-full">
      {dishes.map((dish) => (
        <MenuDishCard key={dish.id} dish={dish} />
      ))}
    </div>
  );
}
