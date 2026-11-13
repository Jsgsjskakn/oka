import { Metadata } from 'next';
import { MenuClient } from '@/components/menu/MenuClient';
import { getCategories, getAllDishes } from '@/lib/services/menu.service';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Menu | The Golden Oak',
};

interface MenuPageProps {
  searchParams?: Promise<{
    filter?: string;
    table?: string;
    category?: string;
    q?: string;
  }>;
}

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const [categories, dishes] = await Promise.all([
    getCategories(),
    getAllDishes(),
  ]);

  return (
    <MenuClient
      categories={categories}
      initialDishes={dishes}
      initialCategory={resolvedSearchParams.category || 'all'}
      initialFilter={resolvedSearchParams.filter}
      initialTable={resolvedSearchParams.table}
      initialSearch={resolvedSearchParams.q || ''}
    />
  );
}
