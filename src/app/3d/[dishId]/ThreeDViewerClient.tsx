'use client';

import { useState, useCallback } from 'react';
import { ThreeDViewer } from '@/components/viewer/ThreeDViewer';
import { useFavoritesStore } from '@/store/favorites-store';
import { useCartStore } from '@/store/cart-store';
import type { ModelConfig } from '@/data/model-config';
import type { Dish } from '@/types/menu';

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
  allModelDishes: Array<{ id: string; name: string; image: string }>;
}

export default function ThreeDViewerClient(props: Props) {
  const currentSlug = props.dishSlug;
  
  const isFavorite = useFavoritesStore((s) => s.isFavorite(currentSlug));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const addItem = useCartStore((s) => s.addItem);

  // Adapt DB dish to legacy Dish type for ThreeDViewer
  const dish: Dish = {
    id: props.dishSlug,
    slug: props.dishSlug,
    name: props.dishName,
    description: props.dishDescription,
    price: props.dishPrice / 100, // Convert paise to rupees for legacy type
    image: props.dishImage,
    category: props.dishCategory as any,
    isVeg: props.dishIsVeg,
    isAvailable: true,
    isFeatured: false,
    isBestSeller: false,
    spiceLevel: 'medium',
    ingredients: props.dishIngredients,
    has3DModel: true,
  };

  const handleAddToCart = useCallback(() => {
    addItem(dish, 1, {});
    if ('vibrate' in navigator) navigator.vibrate(15);
  }, [dish, addItem]);

  const handleToggleFavorite = useCallback(() => {
    toggleFavorite(currentSlug);
    if ('vibrate' in navigator) navigator.vibrate(10);
  }, [currentSlug, toggleFavorite]);

  const handleSwitchDish = useCallback((dishId: string) => {
    window.location.href = `/3d/${dishId}`;
  }, []);

  return (
    <ThreeDViewer
      key={currentSlug}
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
