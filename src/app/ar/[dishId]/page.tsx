import { getAllDishes } from '@/lib/services/menu.service';
import { getModelConfig } from '@/data/model-config';
import { resolveDishImageUrl } from '@/lib/utils/dish-images';
import { notFound } from 'next/navigation';
import ARViewerClient from './ARViewerClient';

export default async function ARViewerPage({ params }: { params: Promise<{ dishId: string }> }) {
  const { dishId: slugOrId } = await params;
  const allDishes = await getAllDishes();
  const dish = allDishes.find(d => d.slug === slugOrId || d.id === slugOrId);
  
  if (!dish) {
    notFound();
  }

  const config = getModelConfig(dish.slug);
  const resolvedImage = resolveDishImageUrl(dish.slug, dish.image_url);
  
  return (
    <ARViewerClient
      dishSlug={dish.slug}
      dishName={dish.name}
      dishDescription={dish.description || ''}
      dishPrice={dish.price_paise}
      dishImage={resolvedImage}
      dishCategory={dish.categories?.slug || 'menu'}
      dishIsVeg={dish.is_veg}
      config={config}
    />
  );
}
