import { getAllDishes } from '@/lib/services/menu.service';
import { FavoritesClient } from './FavoritesClient';
import type { Dish as MockDish } from '@/types/menu';

export default async function FavoritesPage() {
  const allDbDishes = await getAllDishes();

  const mapToMockDish = (d: any): MockDish => ({
    id: d.id,
    slug: d.slug,
    name: d.name,
    description: d.description || '',
    price: d.price_paise / 100,
    originalPrice: d.original_price_paise ? d.original_price_paise / 100 : undefined,
    image: d.image_url || '/images/dishes/placeholder.jpg',
    category: d.categories?.slug as any,
    isVeg: d.is_veg,
    isAvailable: d.is_available,
    isFeatured: d.is_featured,
    isBestSeller: d.is_best_seller,
    spiceLevel: (d.spice_level || 'mild') as any,
    calories: d.calories || undefined,
    preparationTime: d.preparation_time || undefined,
    ingredients: [],
    allergens: d.allergens || [],
    sizes: [], // we don't need full details on list page
    addOns: [],
    removableIngredients: [],
    has3DModel: d.has_3d_model,
  });

  const allDishes = allDbDishes.map(mapToMockDish);

  return <FavoritesClient allDishes={allDishes} />;
}
