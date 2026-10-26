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
  
  // Get all dishes for the switcher
  const allModelDishes = allDishes.map(d => ({
    id: d.slug,
    name: d.name,
    image: d.image_url || '/images/dishes/placeholder.jpg',
    price: d.price_paise ? d.price_paise / 100 : 0,
    category: d.categories?.slug || 'menu',
    isVeg: d.is_veg,
  }));
  
  return (
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
  );
}
