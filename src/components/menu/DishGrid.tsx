'use client';

import { MenuDishCard } from './MenuDishCard';
import { DishWithCategory } from '@/lib/db/types';

interface DishGridProps {
  dishes: DishWithCategory[];
}

export function DishGrid({ dishes }: DishGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4 pb-12">
      {dishes.map((dish) => (
        <MenuDishCard key={dish.id} dish={dish} />
      ))}
    </div>
  );
}
