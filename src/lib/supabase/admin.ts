import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/types';

/**
 * Admin Supabase client using the service role key.
 * ONLY use this in server-side code (API routes, Server Actions).
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || serviceRoleKey === 'REPLACE_WITH_SERVICE_ROLE_KEY_FROM_SUPABASE_DASHBOARD') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to .env.local from Supabase Dashboard > Settings > API.');
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
