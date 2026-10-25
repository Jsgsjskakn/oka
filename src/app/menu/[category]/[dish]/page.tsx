import { notFound } from 'next/navigation';
import { getDishBySlug } from '@/lib/services/menu.service';
import { DishDetailsClient } from '@/components/menu/DishDetailsClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    category: string;
    dish: string;
  }>;
}

export default async function DishDetailsPage({ params }: PageProps) {
  const { category, dish: dishSlug } = await params;
  
  // If the dish card linked to 'all', we don't have a specific category slug for the query.
  // The service function expects the actual category slug to fetch correctly.
  // Let's modify our fetch approach: if category is 'all', we fetch by dishSlug only.
  
  // Actually, getDishBySlug expects (categorySlug, dishSlug)
  // Let's use a workaround if category === 'all'
  let dishData;
  if (category === 'all') {
    // If we only have the dish slug, we need to fetch all dishes and find it
    // Or we can modify getDishBySlug to handle null category, but for now we'll do this:
    const { getAllDishes } = await import('@/lib/services/menu.service');
    const allDishes = await getAllDishes();
    dishData = allDishes.find(d => d.slug === dishSlug);
  } else {
    dishData = await getDishBySlug(category, dishSlug);
  }

  if (!dishData) {
    notFound();
  }

  return <DishDetailsClient dish={dishData} />;
}
