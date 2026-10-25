/**
 * Supabase → Legacy type bridge.
 * Converts Supabase DB rows (with paise pricing) to the existing
 * Dish / Category types used throughout the customer UI.
 * This lets all existing menu components work unchanged.
 */

import type { Dish as LegacyDish, Category as LegacyCategory } from '@/types/menu';
import type { Dish as DBDish, Category as DBCategory, DishSize, DishAddon, DishModel } from '@/lib/db/types';

export function dbDishToLegacy(
  dish: DBDish,
  category: DBCategory,
  sizes?: DishSize[],
  addons?: DishAddon[],
  model?: DishModel | null
): LegacyDish {
  return {
    id: dish.id,
    slug: dish.slug,
    name: dish.name,
    description: dish.description ?? '',
    price: Math.round(dish.price_paise / 100),
    originalPrice: dish.original_price_paise ? Math.round(dish.original_price_paise / 100) : undefined,
    image: dish.image_url ?? '/images/dishes/placeholder.jpg',
    category: category.slug as LegacyDish['category'],  // type assertion — slugs match existing DishCategory values
    isVeg: dish.is_veg,
    isAvailable: dish.is_available,
    isFeatured: dish.is_featured,
    isBestSeller: dish.is_best_seller,
    spiceLevel: (dish.spice_level as LegacyDish['spiceLevel']) ?? 'mild',
    calories: dish.calories ?? undefined,
    preparationTime: dish.preparation_time ?? undefined,
    allergens: dish.allergens ?? undefined,
    has3DModel: dish.has_3d_model,
    modelUrl: model?.model_path ?? undefined,
    sizes: sizes?.map(s => ({
      id: s.id,
      name: s.name,
      priceModifier: Math.round(s.price_modifier_paise / 100),
    })),
    addOns: addons?.map(a => ({
      id: a.id,
      name: a.name,
      price: Math.round(a.price_paise / 100),
    })),
  };
}

export function dbCategoryToLegacy(cat: DBCategory, dishCount = 0): LegacyCategory {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon ?? 'utensils',
    dishCount,
  };
}
