import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/../convex/_generated/api';

export async function getSessionToken(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('golden_oak_session')?.value;
  } catch {
    return undefined;
  }
}

export async function requireAdmin(): Promise<{ userId: string; name: string; sessionToken?: string }> {
  // 1. Primary: Convex Session Check
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('golden_oak_session')?.value;

    if (token) {
      const user = await fetchQuery(api.auth.validateSession, { token });
      if (user && user.role === 'admin') {
        return { userId: user.userId, name: user.name, sessionToken: token };
      }
    }
  } catch (err) {
    console.warn('[admin-auth] Convex validateSession failed, checking Supabase fallback:', err);
  }

  // 2. Supabase Fallback
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active, name')
        .eq('id', user.id)
        .single() as { data: { role: string; is_active: boolean; name: string | null } | null };

      if (profile && profile.role === 'admin' && profile.is_active) {
        return { userId: user.id, name: profile.name ?? 'Admin' };
      }
    }
  } catch {
    // continue to redirect
  }

  redirect('/admin/login');
}

export async function requireStaff(): Promise<{ userId: string; role: string; name: string; sessionToken?: string }> {
  // 1. Primary: Convex Session Check
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('golden_oak_session')?.value;

    if (token) {
      const user = await fetchQuery(api.auth.validateSession, { token });
      if (user && ['admin', 'employee', 'staff', 'manager', 'chef'].includes(user.role)) {
        return { userId: user.userId, role: user.role, name: user.name, sessionToken: token };
      }
    }
  } catch (err) {
    console.warn('[admin-auth] Convex validateSession failed, checking Supabase fallback:', err);
  }

  // 2. Supabase Fallback
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active, name')
        .eq('id', user.id)
        .single() as { data: { role: string; is_active: boolean; name: string | null } | null };

      if (profile && ['admin', 'employee', 'staff', 'manager', 'chef'].includes(profile.role) && profile.is_active) {
        return { userId: user.id, role: profile.role, name: profile.name ?? 'Staff' };
      }
    }
  } catch {
    // continue to redirect
  }

  redirect('/admin/login');
}
