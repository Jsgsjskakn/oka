import { getBookingById } from '@/lib/services/booking.service';
import { redirect } from 'next/navigation';
import { BookingConfirmationCard } from '@/components/booking/BookingConfirmationCard';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; bookingId?: string }>;
}) {
  const { id, bookingId } = await searchParams;
  const resolvedId = bookingId || id;
  if (!resolvedId) {
    redirect('/booking');
  }

  const booking = await getBookingById(resolvedId);

  if (!booking) {
    redirect('/booking');
  }

  // Map DB booking to BookingDetails type for the card
  // Using booking.booking_date directly (YYYY-MM-DD) avoids UTC timezone shifting in date-fns
  const bookingDetails = {
    id: booking.id,
    date: booking.booking_date,
    time: booking.booking_time,
    guests: booking.guests,
    customerName: booking.customer_name,
    customerPhone: booking.customer_phone,
    customerEmail: booking.customer_email || undefined,
    occasion: booking.occasion || undefined,
    tablePreference:
      booking.table_preference ||
      (booking.tables?.table_number ? `Table #${booking.tables.table_number}` : undefined),
    specialRequests: booking.special_requests || undefined,
  };

  return (
    <div className="min-h-screen bg-obsidian pt-4 sm:pt-6 pb-24 md:pb-12 text-text-primary relative">
      <div className="max-w-lg mx-auto px-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 h-10 px-3 bg-[#1a1a1a] rounded-full text-xs font-medium text-text-primary/80 hover:text-text-primary border border-border-subtle active:scale-95 transition-all"
        >
          <ChevronLeft className="w-4 h-4 -ml-0.5" />
          <span>Back Home</span>
        </Link>

        <Link
          href="/profile/reservations"
          className="text-xs font-medium text-primary hover:underline underline-offset-4"
        >
          My Reservations
        </Link>
      </div>

      <div className="pt-2">
        <BookingConfirmationCard booking={bookingDetails} />
      </div>

      <div className="mt-4 text-center px-6">
        <Link
          href="/"
          className="text-primary text-sm font-medium hover:underline underline-offset-4"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
