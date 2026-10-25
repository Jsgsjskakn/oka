'use client';

import { useCallback } from 'react';
import { ARViewer } from '@/components/ar/ARViewer';
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
  config: ModelConfig;
}

export default function ARViewerClient(props: Props) {
  const isFavorite = useFavoritesStore((s) => s.isFavorite(props.dishSlug));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const addItem = useCartStore((s) => s.addItem);

  // Adapt DB dish to legacy Dish type
  const dish: Dish = {
    id: props.dishSlug,
    slug: props.dishSlug,
    name: props.dishName,
    description: props.dishDescription,
    price: props.dishPrice / 100,
    image: props.dishImage,
    category: props.dishCategory as any,
    isVeg: props.dishIsVeg,
    isAvailable: true,
    isFeatured: false,
    isBestSeller: false,
    spiceLevel: 'medium',
    has3DModel: true,
  };

  const handleAddToCart = useCallback(() => {
    addItem(dish, 1, {});
    if ('vibrate' in navigator) navigator.vibrate(15);
  }, [dish, addItem]);

  const handleToggleFavorite = useCallback(() => {
    toggleFavorite(props.dishSlug);
    if ('vibrate' in navigator) navigator.vibrate(10);
  }, [props.dishSlug, toggleFavorite]);

  return (
    <ARViewer
      dish={dish}
      config={props.config}
      isFavorite={isFavorite}
      onToggleFavorite={handleToggleFavorite}
      onAddToCart={handleAddToCart}
    />
  );
}
