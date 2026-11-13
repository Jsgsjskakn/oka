import { getCurrentUser } from '@/lib/auth/convex-auth-actions';
import { createClient } from '@/lib/supabase/server';
import { getBookingsByPhone } from '@/lib/services/booking.service';
import { getOrdersByPhone } from '@/lib/services/order.service';
import { ProfileDashboardClient } from '@/components/profile/ProfileDashboardClient';
import { MockLoginCard } from '@/components/profile/MockLoginCard';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  let resolvedUser: { id: string; email: string } | null = null;
  let resolvedProfile: { name?: string; phone?: string; avatar_url?: string } = {};

  // 1. Primary: Resolve Convex session
  try {
    const convexUser = await getCurrentUser();
    if (convexUser) {
      resolvedUser = {
        id: String(convexUser.userId || convexUser._id || ''),
        email: convexUser.email || '',
      };
      resolvedProfile = {
        name: convexUser.name || convexUser.email?.split('@')[0] || 'Valued Guest',
        phone: convexUser.phone || undefined,
      };
    }
  } catch {
    // Convex unavailable
  }

  // 2. Secondary: Fallback to Supabase session
  if (!resolvedUser) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const { data: profile } = (await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()) as { data: any; error: any };

        resolvedUser = {
          id: data.user.id,
          email: data.user.email || '',
        };
        resolvedProfile = {
          name:
            profile?.name ||
            profile?.full_name ||
            data.user.user_metadata?.full_name ||
            data.user.email?.split('@')[0] ||
            'Valued Guest',
          phone: profile?.phone || data.user.phone || undefined,
          avatar_url: profile?.avatar_url,
        };
      }
    } catch {
      // Supabase unavailable
    }
  }

  // 3. Unauthenticated state: show Customer Sign-In Portal
  if (!resolvedUser) {
    return <MockLoginCard />;
  }

  // 4. Fetch real bookings & orders for authenticated user
  let initialBookings: any[] = [];
  let initialOrders: any[] = [];

  if (resolvedProfile.phone || resolvedUser.email) {
    try {
      const [bookings, orders] = await Promise.all([
        getBookingsByPhone(resolvedProfile.phone, resolvedUser.email),
        getOrdersByPhone(resolvedProfile.phone, resolvedUser.email),
      ]);
      initialBookings = bookings || [];
      initialOrders = orders || [];
    } catch {
      initialBookings = [];
      initialOrders = [];
    }
  }

  return (
    <ProfileDashboardClient
      user={resolvedUser}
      profile={resolvedProfile}
      initialBookings={initialBookings}
      initialOrders={initialOrders}
    />
  );
}
