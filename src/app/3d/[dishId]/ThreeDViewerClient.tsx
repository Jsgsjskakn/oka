'use client';

import { useState, useCallback } from 'react';
import { ThreeDViewer } from '@/components/viewer/ThreeDViewer';
import { useFavoritesStore } from '@/store/favorites-store';
import { useCartStore } from '@/store/cart-store';
import type { ModelConfig } from '@/data/model-config';
import type { Dish, AddOn } from '@/types/menu';

interface Props {
  dishSlug: string;
  dishName: string;
  dishDescription: string;
  dishPrice: number;
  dishImage: string;
  dishCategory: string;
  dishIsVeg: boolean;
  dishIngredients: string[];
  config: ModelConfig;
  allModelDishes: Array<{
    id: string;
    slug?: string;
    name: string;
    description?: string;
    image: string;
    price?: number;
    price_paise?: number;
    category?: string;
    isVeg?: boolean;
    ingredients?: string[];
  }>;
}

export default function ThreeDViewerClient(props: Props) {
  const [currentSlug, setCurrentSlug] = useState(props.dishSlug);

  const activeDishData =
    props.allModelDishes.find((d) => d.id === currentSlug || d.slug === currentSlug) || {
      id: props.dishSlug,
      slug: props.dishSlug,
      name: props.dishName,
      description: props.dishDescription,
      price: props.dishPrice / 100,
      image: props.dishImage,
      category: props.dishCategory,
      isVeg: props.dishIsVeg,
      ingredients: props.dishIngredients,
    };

  const isFavorite = useFavoritesStore((s) => s.isFavorite(currentSlug));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const addItem = useCartStore((s) => s.addItem);

  // Adapt DB dish to legacy Dish type for ThreeDViewer
  const dish: Dish = {
    id: activeDishData.id || currentSlug,
    slug: activeDishData.slug || currentSlug,
    name: activeDishData.name,
    description: activeDishData.description || props.dishDescription,
    price:
      activeDishData.price !== undefined
        ? activeDishData.price
        : props.dishPrice / 100,
    image: activeDishData.image || props.dishImage,
    category: (activeDishData.category || props.dishCategory) as any,
    isVeg: activeDishData.isVeg ?? props.dishIsVeg,
    isAvailable: true,
    isFeatured: false,
    isBestSeller: false,
    spiceLevel: 'medium',
    ingredients: activeDishData.ingredients || props.dishIngredients,
    has3DModel: true,
  };

  const handleAddToCart = useCallback(
    (quantity: number = 1, selectedAddOns?: AddOn[]) => {
      addItem(dish, quantity, { selectedAddOns });
      if ('vibrate' in navigator) navigator.vibrate(15);
    },
    [dish, addItem]
  );

  const handleToggleFavorite = useCallback(() => {
    toggleFavorite(currentSlug);
    if ('vibrate' in navigator) navigator.vibrate(10);
  }, [currentSlug, toggleFavorite]);

  const handleSwitchDish = useCallback((dishId: string) => {
    setCurrentSlug(dishId);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/3d/${dishId}`);
    }
  }, []);

  return (
    <ThreeDViewer
      dish={dish}
      config={props.config}
      allModelDishes={props.allModelDishes}
      onSwitchDish={handleSwitchDish}
      isFavorite={isFavorite}
      onToggleFavorite={handleToggleFavorite}
      onAddToCart={handleAddToCart}
    />
  );
}
