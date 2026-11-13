import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { createAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function DebugPage() {
  // FIND-SEC-01: Disallow access in production environments (return 404 Not Found)
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  // Require administrator authentication even in development/staging
  const admin = await requireAdmin();

  if (!isSupabaseConfigured()) {
    return (
      <pre className="p-4 text-xs">
        Convex Session: {JSON.stringify({ userId: admin.userId, name: admin.name, role: 'admin' })}{'\n'}
        Supabase: Not configured
      </pre>
    );
  }

  let user: { id: string } | null = null;
  let profile: unknown = null;
  let error: unknown = null;
  let adminProfile: unknown = null;
  let adminError: unknown = null;

  try {
    const supabase = await createClient();
    const authRes = await supabase.auth.getUser();
    user = authRes.data.user;

    if (user) {
      const res = await (supabase as any)
        .from('employees')
        .select('role, is_active, name')
        .eq('auth_id', user.id)
        .single();
      profile = res.data;
      error = res.error;

      if (isSupabaseAdminConfigured()) {
        const adminSupabase = createAdminClient();
        const adminRes = await (adminSupabase as any)
          .from('employees')
          .select('role, is_active, name')
          .eq('auth_id', user.id)
          .single();
        adminProfile = adminRes.data;
        adminError = adminRes.error;
      } else {
        adminError = 'SUPABASE_SERVICE_ROLE_KEY not configured';
      }
    }
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <pre className="p-4 text-xs">
      Active Admin: {JSON.stringify({ userId: admin.userId, name: admin.name, role: 'admin' })}{'\n'}
      Supabase User ID: {user?.id ?? 'None (Convex session only)'}{'\n'}
      Standard Client Result: {JSON.stringify(profile)}{'\n'}
      Standard Client Error: {JSON.stringify(error)}{'\n'}
      Admin Client Result: {JSON.stringify(adminProfile)}{'\n'}
      Admin Client Error: {JSON.stringify(adminError)}
    </pre>
  );
}
