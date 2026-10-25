import { getAllDishes } from '@/lib/services/menu.service';
import { getModelConfig } from '@/data/model-config';
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
  
  return (
    <ARViewerClient
      dishSlug={dish.slug}
      dishName={dish.name}
      dishDescription={dish.description || ''}
      dishPrice={dish.price_paise}
      dishImage={dish.image_url || '/images/dishes/placeholder.jpg'}
      dishCategory={dish.categories?.slug || 'menu'}
      dishIsVeg={dish.is_veg}
      config={config}
    />
  );
}
