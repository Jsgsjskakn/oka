'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Minus, Trash2, Sparkles, Heart, Box } from 'lucide-react';
import type { Dish } from '@/types/menu';
import { useCartStore } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';
import { useRecentlyViewedStore } from '@/store/recently-viewed-store';
import { toast } from '@/store/toast-store';
import { hasModel } from '@/data/model-config';

interface DishCardProps {
  dish: Dish;
  onAdd?: (dish: Dish) => void;
}

export function DishCard({ dish, onAdd }: DishCardProps) {
  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const isFav = useFavoritesStore((s) => s.isFavorite(dish.id));
  const toggleFav = useFavoritesStore((s) => s.toggleFavorite);
  const addRecentDish = useRecentlyViewedStore((s) => s.addRecentDish);
  const [isMounted, setIsMounted] = useState(false);

  const recordExplore = () => {
    addRecentDish(
      {
        id: dish.id,
        slug: dish.slug,
        name: dish.name,
        description: dish.description,
        price_paise: Math.round(dish.price * 100),
        image_url: dish.image,
        category: dish.category,
        is_veg: dish.isVeg,
        is_available: dish.isAvailable,
        is_featured: dish.isFeatured,
        is_best_seller: dish.isBestSeller,
        spice_level: dish.spiceLevel,
        has_3d_model: dish.has3DModel,
      },
      '3d_viewer'
    );
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const matchingItems = isMounted
    ? cartItems.filter((i) => i.dish.id === dish.id || i.dish.slug === dish.slug)
    : [];
  const cartQuantity = matchingItems.reduce((acc, curr) => acc + curr.quantity, 0);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAdd) {
      onAdd(dish);
    } else {
      addItem(dish, 1);
    }
    toast.success('Added to Cart', `${dish.name} (₹${dish.price})`);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(12);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const targetItem = matchingItems.find((i) => i.cartItemId === dish.id) || matchingItems[0];
    if (targetItem) {
      updateQuantity(targetItem.cartItemId, targetItem.quantity + 1);
      toast.success('Added More', `${dish.name} (×${cartQuantity + 1})`);
    } else {
      addItem(dish, 1);
      toast.success('Added More', `${dish.name} (×${cartQuantity + 1})`);
    }
    if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const targetItem = matchingItems.find((i) => i.cartItemId === dish.id) || matchingItems[matchingItems.length - 1];
    if (!targetItem) return;

    if (targetItem.quantity > 1) {
      updateQuantity(targetItem.cartItemId, targetItem.quantity - 1);
      toast.info('Updated Quantity', `${dish.name} (×${cartQuantity - 1})`);
    } else {
      removeItem(targetItem.cartItemId);
      toast.info('Removed from Cart', dish.name);
    }
    if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFav(dish.id);
    if (!isFav) {
      toast.info('Added to Favorites', dish.name);
    } else {
      toast.info('Removed from Favorites', dish.name);
    }
  };

  const show3D = Boolean(dish.has3DModel || hasModel(dish.slug));

  return (
    <div className="flex-none w-[280px] sm:w-[300px] rounded-2xl bg-[#09150d]/85 border border-white/[0.08] hover:border-white/20 overflow-hidden group transition-all duration-300 hover:-translate-y-1 shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
      <Link
        href={`/3d/${dish.slug}`}
        onClick={recordExplore}
        className="relative aspect-[4/3] w-full block bg-black/40 overflow-hidden"
      >
        <Image
          src={dish.image || '/images/dishes/placeholder.jpg'}
          alt={dish.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges on Top-Left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {dish.isFeatured && (
            <span className="px-2 py-0.5 bg-[#061209]/85 backdrop-blur-md rounded-lg text-[10px] font-semibold text-[#d4af37] border border-[#d4af37]/40 tracking-wider">
              Featured
            </span>
          )}
          {dish.isBestSeller && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-red-600 to-amber-600 rounded-lg text-[10px] font-bold text-white shadow-md tracking-wider">
              Best Seller
            </span>
          )}
        </div>

        {/* Top-Right: AR Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = `/ar/${dish.slug}`;
          }}
          className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[#0D0A08]/90 border border-[#d4af37]/40 flex items-center gap-1 text-[10px] font-bold text-[#d4af37] shadow-lg hover:scale-105 active:scale-95 transition-transform z-10"
          title="View in AR"
        >
          <Box className="w-3 h-3 text-[#d4af37]" />
          <span>AR</span>
        </button>

        {/* Bottom-Right: Heart Button */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-[#061209]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:scale-110 active:scale-95 transition-transform z-10"
          aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFav ? 'text-rose-400 fill-rose-400' : ''}`} />
        </button>
      </Link>

      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <Link
              href={`/3d/${dish.slug}`}
              onClick={recordExplore}
              className="font-heading text-base font-bold text-white line-clamp-1 hover:text-[#d4af37] transition-colors"
            >
              {dish.name}
            </Link>
            <div className="flex items-center justify-center w-3.5 h-3.5 rounded-sm bg-white p-[2px] mt-0.5 shrink-0">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  dish.isVeg ? 'bg-green-600' : 'bg-red-600'
                }`}
              />
            </div>
          </div>

          <p className="text-xs text-white/60 line-clamp-2 leading-relaxed mb-4 h-9">
            {dish.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] gap-2">
          <span className="text-base font-extrabold text-[#d4af37] shrink-0">
            ₹{dish.price}
          </span>
          <div className="flex items-center gap-1.5">
            <Link
              href={`/ar/${dish.slug}`}
              className="px-2.5 py-1.5 text-xs font-semibold text-[#d4af37] hover:text-black hover:bg-[#d4af37] rounded-xl border border-[#d4af37]/40 transition-all flex items-center gap-1 bg-black/40"
              title={`View ${dish.name} in AR`}
            >
              <Box className="w-3 h-3 text-[#d4af37]" />
              <span>View in AR</span>
            </Link>
            {cartQuantity === 0 ? (
              <button
                type="button"
                onClick={handleAddToCart}
                aria-label={`Add ${dish.name} to cart`}
                className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38936] text-black font-semibold text-xs hover:scale-105 active:scale-95 transition-transform shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            ) : (
              <div
                className="flex items-center rounded-xl overflow-hidden border border-[#d4af37]/60 shadow-md h-8 bg-black/40"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <button
                  type="button"
                  onClick={handleDecrement}
                  aria-label={`Decrease ${dish.name} quantity`}
                  title={cartQuantity === 1 ? 'Remove' : 'Decrease'}
                  className="w-7 h-full flex items-center justify-center text-[#d4af37] hover:bg-[#d4af37] hover:text-black active:scale-90 transition-all cursor-pointer"
                >
                  {cartQuantity === 1 ? (
                    <Trash2 className="w-3 h-3 text-rose-400 hover:text-black" />
                  ) : (
                    <Minus className="w-3 h-3 stroke-[2.5]" />
                  )}
                </button>
                <span className="font-mono text-xs font-bold text-white px-2 border-x border-[#d4af37]/30 select-none">
                  {cartQuantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  aria-label={`Add more ${dish.name}`}
                  title="Add more"
                  className="w-7 h-full flex items-center justify-center text-[#d4af37] hover:bg-[#d4af37] hover:text-black active:scale-90 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
