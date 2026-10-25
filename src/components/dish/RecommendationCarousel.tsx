'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Dish } from '@/types/menu';

interface RecommendationCarouselProps {
  dishes: Dish[];
}

export function RecommendationCarousel({ dishes }: RecommendationCarouselProps) {
  if (!dishes || dishes.length === 0) return null;

  return (
    <div className="pt-8 pb-10">
      <h3 className="px-4 text-sm font-semibold text-text-primary mb-4">
        You may also like
      </h3>
      
      <div className="flex overflow-x-auto gap-4 px-4 pb-4 snap-x snap-mandatory scrollbar-hide">
        {dishes.map((dish) => (
          <Link 
            href={`/menu/${dish.category}/${dish.slug}`} 
            key={dish.id}
            className="block relative w-40 shrink-0 snap-start rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/5 group active:scale-[0.98] transition-transform"
          >
            <div className="relative w-full aspect-square">
              <Image
                src={dish.image || '/images/dishes/placeholder.jpg'}
                alt={dish.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="p-3">
              <h4 className="text-xs font-semibold text-text-primary line-clamp-1 mb-1">
                {dish.name}
              </h4>
              <span className="text-sm font-medium text-primary">
                ₹{dish.price}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
