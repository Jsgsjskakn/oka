import { getCurrentUser } from '@/lib/auth/convex-auth-actions';
import { createClient } from '@/lib/supabase/server';
import { getBookingsByPhone } from '@/lib/services/booking.service';
import { ReservationCard } from '@/components/reservations/ReservationCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { ChevronLeft, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import type { BookingDetails } from '@/types/booking';

export const dynamic = 'force-dynamic';

export default async function ReservationsPage() {
  let userContact: { phone?: string; email?: string } | null = null;

  try {
    const convexUser = await getCurrentUser();
    if (convexUser) {
      userContact = { phone: convexUser.phone, email: convexUser.email };
    }
  } catch {
    // Convex unavailable
  }

  if (!userContact) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const { data: profile } = (await supabase
          .from('profiles')
          .select('phone')
          .eq('id', data.user.id)
          .single()) as { data: any; error: any };
        userContact = {
          phone: profile?.phone || data.user.phone || undefined,
          email: data.user.email || undefined,
        };
      }
    } catch {
      // Supabase unavailable
    }
  }

  let reservations: Array<BookingDetails & { status?: string; tableNumber?: number | null }> = [];

  if (userContact?.phone || userContact?.email) {
    const rawBookings = await getBookingsByPhone(userContact.phone, userContact.email);
    reservations = rawBookings.map((b: any) => {
      return {
        id: b.id,
        date: b.booking_date,
        time: b.booking_time,
        guests: b.guests,
        customerName: b.customer_name,
        customerPhone: b.customer_phone,
        customerEmail: b.customer_email || undefined,
        specialRequests: b.special_requests || undefined,
        occasion: b.occasion || undefined,
        tablePreference: b.table_preference || undefined,
        status: b.status || undefined,
        tableNumber: b.table_number ?? null,
      };
    });
  }

  return (
    <div className="min-h-[calc(100vh-76px)] sm:min-h-[calc(100vh-84px)] bg-obsidian text-text-primary pb-24 md:pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-4 flex items-center justify-between gap-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            aria-label="Back to Profile"
            className="w-10 h-10 flex items-center justify-center -ml-2 text-text-primary/70 hover:text-text-primary active:scale-95 rounded-full hover:bg-white/5"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-heading text-lg sm:text-xl font-bold">My Reservations</h1>
        </div>
        <Link
          href="/booking"
          className="px-3.5 py-1.5 rounded-full bg-primary text-black text-xs font-bold hover:brightness-110 transition-all"
        >
          + Book Table
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
        {!userContact ? (
          <EmptyState
            icon={<CalendarDays className="w-7 h-7 text-text-primary/30" />}
            title="No Reservations Found"
            description="Please sign in to view your reservation history and upcoming bookings."
            actionLabel="Sign In"
            actionHref="/auth/login?redirectTo=/profile/reservations"
          />
        ) : reservations.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="w-7 h-7 text-text-primary/30" />}
            title="No Reservations Found"
            description="Your booking history will appear here once you make a reservation."
            actionLabel="Book a Table"
            actionHref="/booking"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {reservations.map((res) => (
              <ReservationCard key={res.id} reservation={res} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
