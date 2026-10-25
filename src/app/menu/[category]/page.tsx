import { notFound } from 'next/navigation';
import { MenuClient } from '@/components/menu/MenuClient';
import { getCategories, getAllDishes } from '@/lib/services/menu.service';

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const resolvedParams = await params;
  
  const [categories, dishes] = await Promise.all([
    getCategories(),
    getAllDishes(),
  ]);
  
  const currentCategory = categories.find(c => c.slug === resolvedParams.category);
  
  if (!currentCategory) {
    notFound();
  }
  
  return (
    <MenuClient 
      categories={categories} 
      initialDishes={dishes} 
      initialCategory={currentCategory.id} 
    />
  );
}
