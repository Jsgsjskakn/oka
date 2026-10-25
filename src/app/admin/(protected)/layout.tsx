import { requireAdmin } from '@/lib/auth/admin-auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { MagneticCursor } from '@/components/admin/MagneticCursor';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Wait for admin auth (will redirect if not logged in or not admin)
  // We'll use a hack to allow /admin/login to render without auth check.
  // Ideally, login should be moved outside of the admin protected group.
  
  // Since we can't easily read pathname in Server Components without headers() trick that depends on middleware,
  // we'll run requireAdmin and catch redirect? No, redirect throws an error.
  
  // As per instructions, "Admin layout — server component. Must verify auth (requireAdmin) before rendering."
  await requireAdmin();

  return (
    <>
      {/* Force hide native cursor everywhere in Admin */}
      <style dangerouslySetInnerHTML={{ __html: `
        * { cursor: none !important; }
      `}} />
      <div className="flex h-screen w-full bg-obsidian text-text-primary overflow-hidden">
        <MagneticCursor />
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto bg-obsidian">
          {children}
        </main>
      </div>
    </>
  );
}
