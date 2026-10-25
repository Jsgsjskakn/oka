'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import type { Dish } from '@/types/menu';

interface DishDetailHeroProps {
  dish: Dish;
}

export function DishDetailHero({ dish }: DishDetailHeroProps) {
  const router = useRouter();

  return (
    <div className="relative w-full aspect-square bg-[#111]">
      <Image
        src={dish.image || '/images/dishes/placeholder.jpg'}
        alt={dish.name}
        fill
        className="object-cover"
        priority
      />
      
      {/* Top Gradient for readability */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
      
      {/* Back Button */}
      <button 
        onClick={() => router.back()}
        className="absolute top-safe pt-4 left-4 w-10 h-10 rounded-full bg-obsidian/40 backdrop-blur-md flex items-center justify-center text-text-primary border border-border-subtle shadow-lg transition-transform active:scale-95 z-10"
        aria-label="Go back"
      >
        <ChevronLeft className="w-6 h-6 pr-0.5" />
      </button>

      {/* Bottom Gradient for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
    </div>
  );
}
