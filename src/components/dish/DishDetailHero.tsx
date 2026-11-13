'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { resolveDishImageUrl } from '@/lib/utils/dish-images';
import type { Dish } from '@/types/menu';

interface DishDetailHeroProps {
  dish: Dish;
}

export function DishDetailHero({ dish }: DishDetailHeroProps) {
  const router = useRouter();
  const resolvedImage = resolveDishImageUrl(dish.slug, dish.image);

  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#111] sm:rounded-b-3xl overflow-hidden">
      <Image
        src={resolvedImage}
        alt={dish.name}
        fill
        sizes="(max-width: 768px) 100vw, 768px"
        className="object-cover"
        priority
      />

      {/* Top Gradient for readability */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />

      {/* Back Button */}
      <button
        type="button"
        onClick={() => router.back()}
        style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
        className="absolute left-4 w-11 h-11 rounded-full bg-obsidian/55 backdrop-blur-md flex items-center justify-center text-text-primary border border-border-subtle shadow-lg transition-transform active:scale-95 z-10"
        aria-label="Go back"
      >
        <ChevronLeft className="w-6 h-6 pr-0.5" />
      </button>

      {/* Bottom Gradient for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
    </div>
  );
}
