import { requireAdmin } from '@/lib/auth/admin-auth';
import { getTables } from '@/lib/services/table.service';
import { TablesManager } from '@/components/admin/TablesManager';

export const metadata = {
  title: 'Tables | Admin | The Golden Oak',
};

export default async function TablesPage() {
  await requireAdmin();
  const tables = await getTables();

  return (
    <div className="relative min-h-screen p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Background Futuristic Ambient Glow Orbs */}
      <div className="absolute top-12 left-1/4 w-96 h-96 bg-champagne/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <TablesManager initialTables={tables} />
    </div>
  );
}
