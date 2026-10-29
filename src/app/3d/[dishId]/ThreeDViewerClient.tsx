'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeDViewer } from '@/components/viewer/ThreeDViewer';
import { useFavoritesStore } from '@/store/favorites-store';
import { useCartStore } from '@/store/cart-store';
import { useToastStore, toast } from '@/store/toast-store';
import { useRecentlyViewedStore } from '@/store/recently-viewed-store';
import { type ModelConfig, SHARED_DEFAULT_MODEL_PATH, getModelConfig } from '@/data/model-config';
import type { Dish, AddOn } from '@/types/menu';

// Eagerly preload the 3D model and local Draco decoder as soon as this client route loads
useGLTF.preload(SHARED_DEFAULT_MODEL_PATH, '/draco/');

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
  const addRecentDish = useRecentlyViewedStore((s) => s.addRecentDish);

  // Automatically record this explored dish in customer history & account store
  useEffect(() => {
    if (activeDishData && (activeDishData.slug || currentSlug)) {
      addRecentDish(
        {
          id: activeDishData.id || currentSlug,
          slug: activeDishData.slug || currentSlug,
          name: activeDishData.name || props.dishName,
          description: activeDishData.description || props.dishDescription || '',
          price_paise:
            activeDishData.price_paise ||
            (activeDishData.price ? Math.round(activeDishData.price * 100) : props.dishPrice),
          image_url: activeDishData.image || props.dishImage,
          category: (activeDishData.category || props.dishCategory || 'pizza') as string,
          is_veg: activeDishData.isVeg ?? props.dishIsVeg ?? true,
          is_available: true,
          is_featured: false,
          is_best_seller: false,
          spice_level: 'medium',
          ingredients: activeDishData.ingredients || props.dishIngredients || [],
        },
        '3d_viewer'
      );
    }
  }, [currentSlug, activeDishData, addRecentDish, props.dishName, props.dishDescription, props.dishPrice, props.dishImage, props.dishCategory, props.dishIsVeg, props.dishIngredients]);

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

  const activeConfig = useMemo(() => {
    return getModelConfig(activeDishData.slug || currentSlug) || props.config;
  }, [activeDishData.slug, currentSlug, props.config]);

  const handleAddToCart = useCallback(
    (quantity: number = 1, selectedAddOns?: AddOn[]) => {
      addItem(dish, quantity, { selectedAddOns });
      const totalFormatted = `₹${Math.round((dish.price || 0) * quantity)}`;
      toast.success(
        `${quantity}x ${dish.name} added to cart`,
        `Item total: ${totalFormatted}. Ready for checkout in your Order Dossier.`
      );
      if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(15);
    },
    [dish, addItem]
  );

  const handleToggleFavorite = useCallback(() => {
    toggleFavorite(currentSlug);
    const willBeFavorite = !isFavorite;
    toast.info(
      willBeFavorite ? `Saved to Favorites` : `Removed from Favorites`,
      dish.name
    );
    if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10);
  }, [currentSlug, toggleFavorite, isFavorite, dish.name]);

  const handleSwitchDish = useCallback((dishId: string) => {
    setCurrentSlug(dishId);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/3d/${dishId}`);
    }
  }, []);

  return (
    <ThreeDViewer
      dish={dish}
      config={activeConfig}
      allModelDishes={props.allModelDishes}
      onSwitchDish={handleSwitchDish}
      isFavorite={isFavorite}
      onToggleFavorite={handleToggleFavorite}
      onAddToCart={handleAddToCart}
    />
  );
}
