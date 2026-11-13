import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/db/types';

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(
    url &&
    key &&
    !url.includes('REPLACE_WITH') &&
    !key.includes('REPLACE_WITH')
  );
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error('Supabase URL or anon key is not configured.');
  }

  return createBrowserClient<Database>(
    url,
    key
  );
}
