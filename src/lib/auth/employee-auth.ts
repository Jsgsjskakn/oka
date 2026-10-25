import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/../convex/_generated/api';

export async function requireEmployee(): Promise<{ userId: string; role: 'admin' | 'employee'; name: string }> {
  // 1. Primary: Convex Session Check
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('golden_oak_session')?.value;

    if (token) {
      const user = await fetchQuery(api.auth.validateSession, { token });
      if (user && ['admin', 'employee', 'staff', 'manager', 'chef'].includes(user.role)) {
        return {
          userId: user.userId,
          role: user.role === 'admin' ? 'admin' : 'employee',
          name: user.name ?? 'Staff',
        };
      }
    }
  } catch (err) {
    console.warn('[employee-auth] Convex validateSession failed, checking Supabase fallback:', err);
  }

  // 2. Supabase Fallback
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const adminSupabase = (await import('@/lib/supabase/admin')).createAdminClient();
      const { data: profile } = await (adminSupabase as any)
        .from('employees')
        .select('role, is_active, name')
        .eq('auth_id', user.id)
        .single();

      if (profile && profile.is_active && ['admin', 'employee', 'staff', 'manager', 'chef'].includes(profile.role)) {
        return {
          userId: user.id,
          role: profile.role === 'admin' ? 'admin' : 'employee',
          name: profile.name ?? 'Staff',
        };
      }
    }
  } catch {
    // continue
  }

  redirect('/employee/login');
}

export async function getCurrentEmployee(): Promise<{ userId: string; role: string; name: string } | null> {
  // 1. Primary: Convex Session Check
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('golden_oak_session')?.value;

    if (token) {
      const user = await fetchQuery(api.auth.validateSession, { token });
      if (user && ['admin', 'employee', 'staff', 'manager', 'chef'].includes(user.role)) {
        return {
          userId: user.userId,
          role: user.role,
          name: user.name ?? '',
        };
      }
    }
  } catch {
    // continue
  }

  // 2. Supabase Fallback
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const adminSupabase = (await import('@/lib/supabase/admin')).createAdminClient();
    const { data: profile } = await (adminSupabase as any)
      .from('employees')
      .select('role, is_active, name')
      .eq('auth_id', user.id)
      .single();

    if (!profile || !profile.is_active) return null;
    if (!['admin', 'employee', 'staff', 'manager', 'chef'].includes(profile.role)) return null;

    return { userId: user.id, role: profile.role, name: profile.name ?? '' };
  } catch {
    return null;
  }
}
