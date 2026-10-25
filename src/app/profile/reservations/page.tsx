import { getCurrentUser } from '@/lib/auth/convex-auth-actions';
import { getBookingsByPhone } from '@/lib/services/booking.service';
import { ReservationCard } from '@/components/reservations/ReservationCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { ChevronLeft, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import type { BookingDetails } from '@/types/booking';

export default async function ReservationsPage() {
  const user = await getCurrentUser();

  let reservations: BookingDetails[] = [];

  if (user?.phone) {
    const rawBookings = await getBookingsByPhone(user.phone);
    reservations = rawBookings.map((b) => {
      let isoDate = b.booking_date;
      try {
        const d = new Date(b.booking_date);
        if (!isNaN(d.getTime())) {
          isoDate = d.toISOString();
        }
      } catch {}

      return {
        id: b.id,
        date: isoDate,
        time: b.booking_time,
        guests: b.guests,
        customerName: b.customer_name,
        customerPhone: b.customer_phone,
        customerEmail: b.customer_email || undefined,
        specialRequests: b.special_requests || undefined,
        occasion: b.occasion || undefined,
        tablePreference: b.table_preference || undefined,
      };
    });
  }

  return (
    <div className="min-h-screen bg-obsidian text-text-primary pb-24">
      <div className="px-4 py-5 flex items-center gap-3 border-b border-white/5 sticky top-0 bg-obsidian z-40">
        <Link
          href="/profile"
          className="w-10 h-10 flex items-center justify-center -ml-2 text-text-primary/70 hover:text-text-primary active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-heading text-lg font-bold">My Reservations</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {!user ? (
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
          reservations.map((res) => (
            <ReservationCard key={res.id} reservation={res} />
          ))
        )}
      </div>
    </div>
  );
}
