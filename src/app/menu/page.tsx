import { Metadata } from 'next';
import { MenuClient } from '@/components/menu/MenuClient';

export const metadata: Metadata = {
  title: 'Menu | The Golden Oak',
};
import { getCategories, getAllDishes } from '@/lib/services/menu.service';

export default async function MenuPage() {
  const [categories, dishes] = await Promise.all([
    getCategories(),
    getAllDishes(),
  ]);
  
  return <MenuClient categories={categories} initialDishes={dishes} initialCategory="all" />;
}
