import { EditCategoryForm } from '@/components/admin/EditCategoryForm';
import { requireAdmin } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

export default async function NewCategoryPage() {
  await requireAdmin();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-serif text-champagne mb-6">Create New Category</h1>
      <EditCategoryForm isNew={true} />
    </div>
  );
}
