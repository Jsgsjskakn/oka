import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/convex-auth-actions';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // 1. Primary: Convex session
    const convexUser = await getCurrentUser();
    if (convexUser) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: convexUser.userId,
          name: convexUser.name,
          email: convexUser.email,
          phone: convexUser.phone || '',
          role: convexUser.role || 'customer',
        },
      });
    }

    // 2. Secondary: Supabase fallback
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = (await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()) as { data: any; error: any };

        return NextResponse.json({
          authenticated: true,
          user: {
            id: user.id,
            name: profile?.name || user.email?.split('@')[0] || 'Customer',
            email: user.email || '',
            phone: profile?.phone || '',
            role: profile?.role || 'customer',
          },
        });
      }
    } catch {
      // Supabase unavailable
    }

    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { authenticated: false, user: null, error: error.message },
      { status: 200 }
    );
  }
}
