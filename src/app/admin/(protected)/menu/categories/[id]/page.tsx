import { notFound } from 'next/navigation';
import { getCategoryById } from '@/lib/services/menu.service';
import { EditCategoryForm } from '@/components/admin/EditCategoryForm';
import { requireAdmin } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCategoryPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  
  const category = await getCategoryById(id);

  if (!category) {
    notFound();
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-serif text-champagne mb-6">Edit Category: {category.name}</h1>
      <EditCategoryForm category={category} />
    </div>
  );
}
