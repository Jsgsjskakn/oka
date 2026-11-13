'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingBag, Sparkles, Heart, ChevronLeft } from 'lucide-react';
import { DishWithCategory, formatMoney } from '@/lib/db/types';
import { useCartStore, MAX_ITEM_QUANTITY } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';
import { resolveDishImageUrl } from '@/lib/utils/dish-images';
import { hasModel } from '@/data/model-config';

interface DishDetailsClientProps {
  dish: DishWithCategory;
}

export function DishDetailsClient({ dish }: DishDetailsClientProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const isFavStore = useFavoritesStore((s) => s.isDishFavorite([dish.id, dish.slug]));
  const toggleDishFavorite = useFavoritesStore((s) => s.toggleDishFavorite);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isFav = isMounted && isFavStore;
  const resolvedImage = resolveDishImageUrl(dish.slug, dish.image_url);

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const increaseQuantity = () => {
    if (quantity < MAX_ITEM_QUANTITY) setQuantity(quantity + 1);
  };

  const handleAddToCart = () => {
    const cartDish = {
      id: dish.id,
      slug: dish.slug,
      name: dish.name,
      description: dish.description || '',
      price: dish.price_paise / 100,
      image: resolvedImage,
      category: (dish.categories?.slug || 'pizza') as any,
      isVeg: dish.is_veg,
      isAvailable: dish.is_available,
      isFeatured: dish.is_featured,
      isBestSeller: dish.is_best_seller,
      spiceLevel: (dish.spice_level || 'mild') as any,
      has3DModel: Boolean(dish.has_3d_model || hasModel(dish.slug)),
    };

    addItem(cartDish, quantity);
    router.back();
  };

  return (
    <div className="flex flex-col min-h-screen bg-obsidian pb-32">
      <div className="max-w-3xl mx-auto w-full">
        {/* Header Image Section */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#111] sm:rounded-b-3xl overflow-hidden">
          <button
            type="button"
            onClick={() => router.back()}
            style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
            aria-label="Go back"
            className="absolute left-4 z-20 w-11 h-11 rounded-full bg-obsidian/55 backdrop-blur-md flex items-center justify-center border border-border-subtle"
          >
            <ChevronLeft className="w-6 h-6 text-text-primary" />
          </button>

          <button
            type="button"
            onClick={() => toggleDishFavorite(dish.id, [dish.slug])}
            style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            className="absolute right-4 z-20 w-11 h-11 rounded-full bg-obsidian/55 backdrop-blur-md flex items-center justify-center border border-border-subtle"
          >
            <Heart className={`w-5 h-5 ${isFav ? 'text-red-500 fill-red-500' : 'text-text-primary'}`} />
          </button>

          <Image
            src={resolvedImage}
            alt={dish.name}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />

          {/* Gradient Overlay for seamless transition */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
        </div>

        {/* Content Section */}
        <div className="flex-1 px-6 -mt-6 relative z-10">
          <div className="flex justify-between items-start gap-4 mb-2">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary">{dish.name}</h1>
            <div className="flex items-center justify-center w-5 h-5 rounded-sm bg-white p-[3px] mt-2 shrink-0">
              <div className={`w-full h-full rounded-full ${dish.is_veg ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
          </div>

          <p className="text-2xl font-medium text-primary mb-6">
            {formatMoney(dish.price_paise)}
          </p>

          {(dish.has_3d_model || hasModel(dish.slug)) && (
            <button
              type="button"
              onClick={() => router.push(`/3d/${dish.slug}`)}
              className="w-full min-h-[48px] flex items-center justify-center gap-3 py-3 mb-6 bg-white/5 border border-primary/30 rounded-xl text-primary font-medium hover:bg-white/10 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              View in 3D AR
            </button>
          )}

          <div className="mb-8">
            <h2 className="text-lg font-medium text-text-primary mb-2">Description</h2>
            <p className="text-text-secondary leading-relaxed text-sm">
              {dish.description}
            </p>
          </div>
        </div>
      </div>

      {/* Quantity & Add to Cart fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-obsidian/90 backdrop-blur-xl border-t border-border-subtle z-40">
        <div className="max-w-3xl mx-auto flex items-center gap-3 sm:gap-4">
          <div className="flex items-center bg-white/5 rounded-xl border border-border-subtle p-1 shrink-0">
            <button
              type="button"
              onClick={decreaseQuantity}
              aria-label="Decrease quantity"
              className="w-11 h-11 flex items-center justify-center text-text-primary disabled:opacity-40 active:scale-95 transition-transform"
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium text-text-primary">{quantity}</span>
            <button
              type="button"
              onClick={increaseQuantity}
              aria-label="Increase quantity"
              className="w-11 h-11 flex items-center justify-center text-text-primary disabled:opacity-40 active:scale-95 transition-transform"
              disabled={quantity >= MAX_ITEM_QUANTITY}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 min-h-[48px] flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-black font-semibold py-3.5 rounded-xl transition-colors active:scale-[0.98]"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Add to Cart - {formatMoney(dish.price_paise * quantity)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
