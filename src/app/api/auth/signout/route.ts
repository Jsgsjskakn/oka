import { NextResponse } from 'next/server';
import { signoutAction } from '@/lib/auth/convex-auth-actions';

export async function POST(request: Request) {
  try {
    await signoutAction();
  } catch {
    // ignore session cookie cleanup errors
  }

  try {
    const { createClient, isSupabaseConfigured } = await import('@/lib/supabase/server');
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      await supabase.auth.signOut();
    }
  } catch {
    // ignore
  }

  const url = new URL(request.url);
  return NextResponse.redirect(new URL('/', url.origin));
}
