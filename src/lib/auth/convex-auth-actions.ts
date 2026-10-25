'use server';

import { cookies } from 'next/headers';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@/../convex/_generated/api';

const COOKIE_NAME = 'golden_oak_session';

export async function loginAction(formData: {
  identifier: string;
  password: string;
  roleRequired?: 'admin' | 'employee' | 'customer';
}): Promise<{ success?: boolean; error?: string; user?: any }> {
  try {
    const res = await fetchMutation(api.auth.signIn, {
      identifier: formData.identifier,
      password: formData.password,
    });

    if (res.error) {
      return { error: res.error };
    }

    if (!res.user || !res.token) {
      return { error: 'Authentication failed' };
    }

    // Role-based gate
    if (formData.roleRequired === 'admin' && res.user.role !== 'admin') {
      return { error: 'Access denied. Admin privileges required.' };
    }

    if (
      formData.roleRequired === 'employee' &&
      !['admin', 'employee', 'staff', 'manager', 'chef'].includes(res.user.role)
    ) {
      return { error: 'Access denied. Employee accounts only.' };
    }

    // Set HTTP-only secure cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, res.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return { success: true, user: res.user };
  } catch (err: any) {
    return { error: err.message || 'Login failed' };
  }
}

export async function signupAction(formData: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}): Promise<{ success?: boolean; error?: string; user?: any }> {
  try {
    const res = await fetchMutation(api.auth.signUp, {
      email: formData.email,
      password: formData.password,
      name: formData.name,
      phone: formData.phone,
    });

    if (res.error) {
      return { error: res.error };
    }

    if (!res.user || !res.token) {
      return { error: 'Signup failed' };
    }

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, res.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return { success: true, user: res.user };
  } catch (err: any) {
    return { error: err.message || 'Signup failed' };
  }
}

export async function signoutAction(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (token) {
      await fetchMutation(api.auth.signOut, { token });
    }
    cookieStore.delete(COOKIE_NAME);
  } catch {
    // Delete cookie anyway
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
  }
  return { success: true };
}

export async function getCurrentUser(): Promise<any | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const user = await fetchQuery(api.auth.validateSession, { token });
    return user || null;
  } catch {
    return null;
  }
}

export async function requestPasswordResetAction(
  email: string
): Promise<{ success: boolean; resetToken?: string }> {
  try {
    const res = await fetchMutation(api.auth.requestPasswordReset, { email });
    return { success: true };
  } catch {
    return { success: true };
  }
}

export async function resetPasswordAction(
  token: string,
  newPassword: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const res = await fetchMutation(api.auth.resetPassword, {
      token,
      newPassword,
    });
    if (res.error) return { error: res.error };
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to reset password' };
  }
}

export async function updateUserProfileAction(payload: {
  name: string;
  phone?: string;
}): Promise<{ success?: boolean; error?: string; user?: any }> {
  let writeOccurred = false;

  // 1. Primary: Try Convex if authenticated via golden_oak_session
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (token) {
      const res = await fetchMutation(api.auth.updateUserProfile, {
        sessionToken: token,
        name: payload.name,
        phone: payload.phone,
      });

      if (res && res.error) {
        return { error: res.error };
      }

      if (res && res.success) {
        writeOccurred = true;
        return { success: true, user: res.user };
      }
    }
  } catch (err: any) {
    console.warn('[auth-actions] Convex updateUserProfile failed:', err);
  }

  // 2. Secondary: Fallback to Supabase if authenticated via Supabase session
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          name: payload.name.trim(),
          phone: payload.phone ? payload.phone.replace(/\D/g, '').slice(-10) : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        return { error: error.message };
      }

      writeOccurred = true;
      return { success: true };
    }
  } catch (err: any) {
    console.warn('[auth-actions] Supabase update profile failed:', err);
  }

  if (!writeOccurred) {
    return { error: 'Authentication required. No active session found to update.' };
  }

  return { success: true };
}
