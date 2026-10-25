import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function DebugPage() {
  // FIND-SEC-01: Disallow access in production environments (return 404 Not Found)
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  // Require administrator authentication even in development/staging
  await requireAdmin();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>No user</div>;

  const { data: profile, error } = await (supabase as any)
    .from('employees')
    .select('role, is_active, name')
    .eq('auth_id', user.id)
    .single();

  const adminSupabase = createAdminClient();
  const { data: adminProfile, error: adminError } = await (adminSupabase as any)
    .from('employees')
    .select('role, is_active, name')
    .eq('auth_id', user.id)
    .single();

  return (
    <pre>
      User ID: {user.id}{'\n'}
      Standard Client Result: {JSON.stringify(profile)}{'\n'}
      Standard Client Error: {JSON.stringify(error)}{'\n'}
      Admin Client Result: {JSON.stringify(adminProfile)}{'\n'}
      Admin Client Error: {JSON.stringify(adminError)}
    </pre>
  );
}
