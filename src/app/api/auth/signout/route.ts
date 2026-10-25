import { NextResponse } from 'next/server';
import { signoutAction } from '@/lib/auth/convex-auth-actions';

export async function POST(request: Request) {
  await signoutAction();

  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }

  const url = new URL(request.url);
  return NextResponse.redirect(new URL('/', url.origin));
}
