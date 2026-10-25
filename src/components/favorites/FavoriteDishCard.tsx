'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import type { Dish } from '@/types/menu';
import { useFavoritesStore } from '@/store/favorites-store';

interface FavoriteDishCardProps {
  dish: Dish;
}

export function FavoriteDishCard({ dish }: FavoriteDishCardProps) {
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  return (
    <div className="relative bg-[#1a1a1a] border border-white/5 rounded-xl overflow-hidden">
      <Link href={`/menu/${dish.category}/${dish.slug}`} className="block">
        <div className="relative aspect-[4/3] w-full bg-[#111]">
          <Image src={dish.image || '/images/dishes/placeholder.jpg'} alt={dish.name} fill className="object-cover" />
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h3 className="font-heading text-sm font-semibold text-text-primary line-clamp-1">{dish.name}</h3>
            <div className="flex items-center justify-center w-3 h-3 rounded-sm bg-white p-[2px] shrink-0">
              <div className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
          </div>
          <span className="text-sm font-medium text-primary">₹{dish.price}</span>
        </div>
      </Link>

      <button
        onClick={(e) => { e.preventDefault(); toggleFavorite(dish.id); }}
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-obsidian/60 backdrop-blur-md flex items-center justify-center border border-border-subtle active:scale-90 transition-transform"
      >
        <Heart className="w-4 h-4 text-red-400 fill-red-400" />
      </button>
    </div>
  );
}
