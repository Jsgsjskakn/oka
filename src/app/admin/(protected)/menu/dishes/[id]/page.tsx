import { notFound } from 'next/navigation';
import { getDishById, getCategories, getDishSizes, getDishAddons } from '@/lib/services/menu.service';
import { EditDishForm } from '@/components/admin/EditDishForm';
import { requireAdmin } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditDishPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  
  const [dish, categories, sizes, addOns] = await Promise.all([
    getDishById(id),
    getCategories(),
    getDishSizes(id),
    getDishAddons(id)
  ]);

  if (!dish) {
    notFound();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-serif text-champagne mb-6">Edit Dish: {dish.name}</h1>
      <EditDishForm 
        dish={dish} 
        categories={categories} 
        initialSizes={sizes} 
        initialAddOns={addOns} 
      />
    </div>
  );
}
