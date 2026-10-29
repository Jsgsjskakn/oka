import { getAllDishes } from '@/lib/services/menu.service';
import { getModelConfig } from '@/data/model-config';
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
  
  // Get all dishes with complete culinary metadata for seamless client-side switching
  const allModelDishes = allDishes.map(d => ({
    id: d.slug,
    slug: d.slug,
    name: d.name,
    description: d.description || '',
    image: d.image_url || '/images/dishes/placeholder.jpg',
    price: d.price_paise ? d.price_paise / 100 : 0,
    price_paise: d.price_paise,
    category: d.categories?.slug || 'menu',
    isVeg: d.is_veg,
    ingredients: d.allergens || [],
  }));
  
  return (
    <>
      {/* High-priority browser preloads for instant 3D model & decoder bootstrap */}
      <link rel="preload" href="/models/warrior_model.glb" as="fetch" crossOrigin="anonymous" />
      <link rel="preload" href="/draco/draco_decoder.wasm" as="fetch" crossOrigin="anonymous" />
      <link rel="preload" href="/draco/draco_wasm_wrapper.js" as="script" />

      <ThreeDViewerClient
        dishSlug={dish.slug}
        dishName={dish.name}
        dishDescription={dish.description || ''}
        dishPrice={dish.price_paise}
        dishImage={dish.image_url || '/images/dishes/placeholder.jpg'}
        dishCategory={dish.categories?.slug || 'menu'}
        dishIsVeg={dish.is_veg}
        dishIngredients={dish.allergens || []}
        config={config}
        allModelDishes={allModelDishes}
      />
    </>
  );
}
