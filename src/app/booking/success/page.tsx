import { getBookingById } from '@/lib/services/booking.service';
import { redirect } from 'next/navigation';
import { BookingConfirmationCard } from '@/components/booking/BookingConfirmationCard';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default async function BookingSuccessPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  if (!id) {
    redirect('/booking');
  }

  const booking = await getBookingById(id);

  if (!booking) {
    redirect('/booking');
  }

  // Map DB booking to BookingDetails type for the card
  const bookingDetails = {
    id: booking.id,
    date: new Date(booking.booking_date).toISOString(),
    time: booking.booking_time,
    guests: booking.guests,
    customerName: booking.customer_name,
    customerPhone: booking.customer_phone,
  };

  return (
    <div className="min-h-screen bg-obsidian pb-8 text-text-primary relative">
      <div className="absolute top-4 left-4 z-50">
        <Link 
          href="/"
          className="w-10 h-10 bg-[#1a1a1a] rounded-full flex items-center justify-center text-text-primary/70 hover:text-text-primary border border-border-subtle active:scale-95 transition-all"
        >
          <ChevronLeft className="w-6 h-6 -ml-0.5" />
        </Link>
      </div>

      <div className="pt-16">
        <BookingConfirmationCard booking={bookingDetails} />
      </div>

      <div className="mt-8 text-center px-6">
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
