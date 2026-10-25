'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Heart, Plus } from 'lucide-react';
import { DishWithCategory, formatMoney } from '@/lib/db/types';
import { useFavoritesStore } from '@/store/favorites-store';
import { useCartStore } from '@/store/cart-store';
import { useRecentlyViewedStore } from '@/store/recently-viewed-store';
import { toast } from '@/store/toast-store';
import { hasModel } from '@/data/model-config';

interface MenuDishCardProps {
  dish: DishWithCategory;
}

export function MenuDishCard({ dish }: MenuDishCardProps) {
  const isFav = useFavoritesStore((s) => s.isFavorite(dish.id));
  const toggleFav = useFavoritesStore((s) => s.toggleFavorite);
  const addItem = useCartStore((s) => s.addItem);
  const addRecentDish = useRecentlyViewedStore((s) => s.addRecentDish);

  const handleCardClick = () => {
    addRecentDish(dish);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(
      {
        id: dish.id,
        slug: dish.slug,
        name: dish.name,
        description: dish.description || '',
        price: dish.price_paise / 100,
        image: dish.image_url || '/images/dishes/placeholder.jpg',
        category: (dish.categories?.slug as any) || 'pizza',
        isVeg: dish.is_veg,
        isAvailable: dish.is_available,
        isFeatured: dish.is_featured,
        isBestSeller: dish.is_best_seller,
        spiceLevel: (dish.spice_level as any) || 'mild',
        has3DModel: dish.has_3d_model,
      },
      1
    );
    toast.success('Added to Cart', `${dish.name} (${formatMoney(dish.price_paise)})`);
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFav(dish.id);
    if (!isFav) {
      toast.info('Added to Favorites', dish.name);
    } else {
      toast.info('Removed from Favorites', dish.name);
    }
  };

  const show3D = Boolean(dish.has_3d_model || hasModel(dish.slug));

  return (
    <div className="flex flex-col w-full rounded-2xl bg-[#09150d]/85 border border-white/[0.08] hover:border-white/20 transition-all duration-300 hover:-translate-y-1 overflow-hidden group shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
      <Link
        href={`/menu/${dish.categories?.slug || 'all'}/${dish.slug}`}
        onClick={handleCardClick}
        className="relative aspect-[4/3] w-full block bg-black/40 overflow-hidden"
      >
        <Image
          src={dish.image_url || '/images/dishes/placeholder.jpg'}
          alt={dish.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges on Top-Left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {dish.is_featured && (
            <span className="px-2 py-0.5 bg-[#061209]/85 backdrop-blur-md rounded-lg text-[10px] font-semibold text-[#d4af37] border border-[#d4af37]/40 tracking-wider">
              Featured
            </span>
          )}
          {dish.is_best_seller && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-red-600 to-amber-600 rounded-lg text-[10px] font-bold text-white shadow-md tracking-wider">
              Best Seller
            </span>
          )}
        </div>

        {/* Top-Right: 3D Button */}
        {show3D && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/3d/${dish.slug}`;
            }}
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-[#d4af37] flex items-center justify-center text-black shadow-lg hover:scale-110 active:scale-95 transition-transform z-10"
            title="View in 3D"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Bottom-Right: Heart Button */}
        <button
          type="button"
          onClick={handleToggleFav}
          className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-[#061209]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:scale-110 active:scale-95 transition-transform z-10"
          aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFav ? 'text-rose-400 fill-rose-400' : ''}`} />
        </button>
      </Link>

      <div className="p-3.5 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <Link
              href={`/menu/${dish.categories?.slug || 'all'}/${dish.slug}`}
              onClick={handleCardClick}
              className="font-heading text-sm sm:text-base font-bold text-white line-clamp-1 hover:text-[#d4af37] transition-colors"
            >
              {dish.name}
            </Link>
            <div className="flex items-center justify-center w-3.5 h-3.5 rounded-sm bg-white p-[2px] mt-0.5 shrink-0">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  dish.is_veg ? 'bg-green-600' : 'bg-red-600'
                }`}
              />
            </div>
          </div>

          <p className="text-xs text-white/60 line-clamp-2 leading-relaxed mb-3.5 h-8">
            {dish.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06]">
          <span className="text-sm sm:text-base font-extrabold text-[#d4af37]">
            {formatMoney(dish.price_paise)}
          </span>
          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Add ${dish.name} to cart`}
            className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38936] text-black font-semibold text-xs hover:scale-105 active:scale-95 transition-transform shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
