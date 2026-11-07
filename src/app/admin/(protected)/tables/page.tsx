import { requireAdmin } from '@/lib/auth/admin-auth';
import { getTables } from '@/lib/services/table.service';
import { TablesManager } from '@/components/admin/TablesManager';

export const metadata = {
  title: 'Floor Tables | Admin | The Golden Oak',
};

export default async function TablesPage() {
  await requireAdmin();
  const tables = await getTables();

  return (
    <div className="space-y-3 select-none font-sans">
      <TablesManager initialTables={tables} />
    </div>
  );
}
