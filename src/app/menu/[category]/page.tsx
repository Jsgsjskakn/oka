import { notFound } from 'next/navigation';
import { MenuClient } from '@/components/menu/MenuClient';
import { getCategories, getAllDishes } from '@/lib/services/menu.service';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams?: Promise<{ filter?: string; table?: string; q?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const [categories, dishes] = await Promise.all([
    getCategories(),
    getAllDishes(),
  ]);

  const currentCategory = categories.find((c) => c.slug === resolvedParams.category);

  if (!currentCategory) {
    notFound();
  }

  return (
    <MenuClient
      categories={categories}
      initialDishes={dishes}
      initialCategory={currentCategory.slug}
      initialFilter={resolvedSearchParams.filter}
      initialTable={resolvedSearchParams.table}
      initialSearch={resolvedSearchParams.q || ''}
    />
  );
}
