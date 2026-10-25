'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Heart } from 'lucide-react';
import { DishWithCategory, formatMoney } from '@/lib/db/types';
import { useFavoritesStore } from '@/store/favorites-store';
import { hasModel } from '@/data/model-config';

interface MenuDishCardProps {
  dish: DishWithCategory;
}

export function MenuDishCard({ dish }: MenuDishCardProps) {
  const isFav = useFavoritesStore((s) => s.isFavorite(dish.id));
  const toggleFav = useFavoritesStore((s) => s.toggleFavorite);

  return (
    <Link 
      href={`/menu/${dish.categories?.slug || 'all'}/${dish.slug}`}
      className="flex flex-col w-full glass-card rounded-2xl overflow-hidden group transition-transform hover:scale-[1.01] active:scale-[0.98]"
    >
      <div className="relative aspect-[4/3] w-full bg-[#111]">
        <Image
          src={dish.image_url || '/images/dishes/placeholder.jpg'}
          alt={dish.name}
          fill
          className="object-cover"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {dish.is_featured && (
            <span className="px-2 py-0.5 bg-obsidian/80 backdrop-blur-md rounded-md text-[10px] font-medium text-primary border border-primary/30 uppercase tracking-wider">
              Featured
            </span>
          )}
          {dish.is_best_seller && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-red-600 to-orange-500 rounded-md text-[10px] font-medium text-text-primary shadow-lg uppercase tracking-wider">
              Best Seller
            </span>
          )}
        </div>

        {(dish.has_3d_model || hasModel(dish.slug)) && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/3d/${dish.slug}`; }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary/80 backdrop-blur-md flex items-center justify-center border border-primary/50 shadow-lg active:scale-90 transition-transform z-10"
            aria-label="View in 3D"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
          </button>
        )}

        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(dish.id); }}
          className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-obsidian/60 backdrop-blur-md flex items-center justify-center border border-border-subtle active:scale-90 transition-transform z-10"
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFav ? 'text-red-400 fill-red-400' : 'text-text-primary/60'}`} />
        </button>
      </div>

      <div className="p-3 relative flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-heading text-sm sm:text-base font-semibold text-text-primary line-clamp-1">{dish.name}</h3>
          <div className="flex items-center justify-center w-3 h-3 rounded-sm bg-white p-[2px] mt-1 shrink-0">
            <div className={`w-1.5 h-1.5 rounded-full ${dish.is_veg ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </div>
        
        <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 mb-3 h-8">
          {dish.description}
        </p>

        <div className="mt-auto">
          <span className="text-sm sm:text-base font-medium text-primary">{formatMoney(dish.price_paise)}</span>
        </div>
      </div>
    </Link>
  );
}
