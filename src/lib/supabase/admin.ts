import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/types';

/**
 * Admin Supabase client using the service role key.
 * ONLY use this in server-side code (API routes, Server Actions).
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function isSupabaseAdminConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(
    url &&
    serviceRoleKey &&
    !url.includes('REPLACE_WITH') &&
    !serviceRoleKey.includes('REPLACE_WITH')
  );
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey || serviceRoleKey === 'REPLACE_WITH_SERVICE_ROLE_KEY_FROM_SUPABASE_DASHBOARD') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to .env.local from Supabase Dashboard > Settings > API.');
  }
  return createClient<Database>(
    url,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
