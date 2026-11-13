import { getAllDishes } from '@/lib/services/menu.service';
import { getModelConfig } from '@/data/model-config';
import { dishes as mockDishes } from '@/data/mock-menu';
import { resolveDishImageUrl } from '@/lib/utils/dish-images';
import { notFound } from 'next/navigation';
import ThreeDViewerClient from './ThreeDViewerClient';

export default async function ThreeDViewerPage({ params }: { params: Promise<{ dishId: string }> }) {
  const { dishId: slugOrId } = await params;
  const allDishes = await getAllDishes();
  const dish = allDishes.find(d => d.slug === slugOrId || d.id === slugOrId);
  
  if (!dish) {
    notFound();
  }

  const config = getModelConfig(dish.slug);
  const mockBySlug = new Map(mockDishes.map((m) => [m.slug, m]));
  const activeMock = mockBySlug.get(dish.slug);
  const resolvedDishImage = resolveDishImageUrl(dish.slug, dish.image_url);
  const resolvedDishIngredients =
    activeMock?.ingredients && activeMock.ingredients.length > 0
      ? activeMock.ingredients
      : dish.allergens || [];
  
  // Get all dishes with complete culinary metadata for seamless client-side switching
  const allModelDishes = allDishes.map(d => {
    const mockMatch = mockBySlug.get(d.slug);
    const ingredients =
      mockMatch?.ingredients && mockMatch.ingredients.length > 0
        ? mockMatch.ingredients
        : d.allergens || [];

    return {
      id: d.slug,
      slug: d.slug,
      name: d.name,
      description: d.description || mockMatch?.description || '',
      image: resolveDishImageUrl(d.slug, d.image_url),
      price: d.price_paise ? d.price_paise / 100 : 0,
      price_paise: d.price_paise,
      category: d.categories?.slug || mockMatch?.category || 'menu',
      isVeg: d.is_veg,
      ingredients,
      calories: d.calories ?? mockMatch?.calories,
      preparationTime: d.preparation_time ?? mockMatch?.preparationTime,
      spiceLevel: d.spice_level ?? mockMatch?.spiceLevel,
    };
  });
  
  return (
    <>
      {/* High-priority browser preloads for Draco WASM decoder bootstrap (tier-specific LOD GLB is selected dynamically per device) */}
      <link rel="preload" href="/draco/draco_decoder.wasm" as="fetch" crossOrigin="anonymous" />
      <link rel="preload" href="/draco/draco_wasm_wrapper.js" as="script" />

      <ThreeDViewerClient
        dishSlug={dish.slug}
        dishName={dish.name}
        dishDescription={dish.description || activeMock?.description || ''}
        dishPrice={dish.price_paise}
        dishImage={resolvedDishImage}
        dishCategory={dish.categories?.slug || activeMock?.category || 'menu'}
        dishIsVeg={dish.is_veg}
        dishIngredients={resolvedDishIngredients}
        config={config}
        allModelDishes={allModelDishes}
      />
    </>
  );
}
