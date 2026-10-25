import { redirect } from 'next/navigation';
import { getSetting } from '@/lib/services/settings.service';
import { getCurrentUser } from '@/lib/auth/convex-auth-actions';
import BookingClient from './BookingClient';

const RESTAURANT_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

export default async function BookingPage() {
  let userId = '';
  let userName = '';
  let userEmail = '';
  let userPhone = '';

  // 1. Check Convex user primary
  const convexUser = await getCurrentUser();
  if (convexUser) {
    userId = convexUser.userId;
    userName = convexUser.name;
    userEmail = convexUser.email;
    userPhone = convexUser.phone || '';
  } else {
    // 2. Fallback to Supabase
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        userId = user.id;
        userEmail = user.email || '';
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email, phone')
          .eq('id', user.id)
          .single() as { data: any, error: any };
        userName = profile?.name || user.email?.split('@')[0] || '';
        userPhone = profile?.phone || '';
      }
    } catch {
      // ignore
    }
  }

  if (!userId) {
    redirect('/auth/login?redirectTo=/booking');
  }

  const advanceAmountRaw = await getSetting(RESTAURANT_ID, 'advance_booking_amount_paise');
  const advanceAmount = typeof advanceAmountRaw === 'number' ? advanceAmountRaw : 50000;

  return (
    <BookingClient 
      userId={userId}
      userName={userName}
      userEmail={userEmail}
      userPhone={userPhone}
      advanceAmountPaise={advanceAmount}
    />
  );
}
