'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingBag, Sparkles, Heart, ChevronLeft } from 'lucide-react';
import { DishWithCategory, formatMoney } from '@/lib/db/types';
import { useCartStore } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';
import { hasModel } from '@/data/model-config';

interface DishDetailsClientProps {
  dish: DishWithCategory;
}

export function DishDetailsClient({ dish }: DishDetailsClientProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const isFav = useFavoritesStore((s) => s.isFavorite(dish.id));
  const toggleFav = useFavoritesStore((s) => s.toggleFavorite);

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const increaseQuantity = () => {
    if (quantity < 10) setQuantity(quantity + 1);
  };

  const handleAddToCart = () => {
    // Map DB type to CartStore type
    const cartDish = {
      id: dish.id,
      slug: dish.slug,
      name: dish.name,
      description: dish.description || '',
      price: dish.price_paise / 100, // Convert from paise to rupees for the cart
      image: dish.image_url || '/images/dishes/placeholder.jpg',
      category: dish.categories?.slug || 'unknown',
      isVeg: dish.is_veg,
      isAvailable: dish.is_available,
      isFeatured: dish.is_featured,
      isBestSeller: dish.is_best_seller,
      spiceLevel: dish.spice_level || 'mild',
      has3DModel: true,
    };
    
    // @ts-ignore - Ignoring strict type checking since this is a mapped object
    addItem(cartDish, quantity);
    
    router.back();
  };

  return (
    <div className="flex flex-col min-h-screen bg-obsidian pb-24">
      {/* Header Image Section */}
      <div className="relative w-full aspect-square md:aspect-video bg-[#111]">
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-obsidian/40 backdrop-blur-md flex items-center justify-center border border-border-subtle"
        >
          <ChevronLeft className="w-6 h-6 text-text-primary" />
        </button>

        <button
          onClick={() => toggleFav(dish.id)}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-obsidian/40 backdrop-blur-md flex items-center justify-center border border-border-subtle"
        >
          <Heart className={`w-5 h-5 ${isFav ? 'text-red-500 fill-red-500' : 'text-text-primary'}`} />
        </button>

        <Image
          src={dish.image_url || '/images/dishes/placeholder.jpg'}
          alt={dish.name}
          fill
          className="object-cover"
          priority
        />
        
        {/* Gradient Overlay for seamless transition */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Content Section */}
      <div className="flex-1 px-6 -mt-6 relative z-10">
        <div className="flex justify-between items-start gap-4 mb-2">
          <h1 className="text-3xl font-heading font-bold text-text-primary">{dish.name}</h1>
          <div className="flex items-center justify-center w-5 h-5 rounded-sm bg-white p-[3px] mt-2 shrink-0">
            <div className={`w-full h-full rounded-full ${dish.is_veg ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </div>
        
        <p className="text-2xl font-medium text-primary mb-6">
          {formatMoney(dish.price_paise)}
        </p>

        {(dish.has_3d_model || hasModel(dish.slug)) && (
          <button
            onClick={() => router.push(`/3d/${dish.slug}`)}
            className="w-full flex items-center justify-center gap-3 py-3 mb-6 bg-white/5 border border-primary/30 rounded-xl text-primary font-medium hover:bg-white/10 transition-colors"
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

        {/* Quantity & Add to Cart fixed at bottom for mobile */}
        <div className="fixed bottom-[80px] left-0 right-0 p-4 bg-obsidian/80 backdrop-blur-xl border-t border-border-subtle flex items-center gap-4 z-40">
          <div className="flex items-center bg-white/5 rounded-xl border border-border-subtle p-1">
            <button
              onClick={decreaseQuantity}
              className="w-10 h-10 flex items-center justify-center text-text-primary active:scale-95 transition-transform"
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium text-text-primary">{quantity}</span>
            <button
              onClick={increaseQuantity}
              className="w-10 h-10 flex items-center justify-center text-text-primary active:scale-95 transition-transform"
              disabled={quantity >= 10}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-black font-semibold py-3.5 rounded-xl transition-colors active:scale-[0.98]"
          >
            <ShoppingBag className="w-5 h-5" />
            Add to Cart - {formatMoney(dish.price_paise * quantity)}
          </button>
        </div>
      </div>
    </div>
  );
}
