import { getBookingById } from '@/lib/services/booking.service';
import { resolveReservationPresentation } from '@/components/reservations/ReservationCard';
import { ChevronLeft, CalendarDays, Clock, Users, MapPin, PartyPopper, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ reservationId: string }>;
}) {
  const { reservationId } = await params;
  const rawBooking: any = await getBookingById(reservationId);

  if (!rawBooking) {
    return (
      <div className="min-h-[calc(100vh-76px)] sm:min-h-[calc(100vh-84px)] bg-obsidian text-text-primary flex flex-col items-center justify-center px-8 pb-24 md:pb-12">
        <p className="text-lg font-semibold mb-2">Reservation Not Found</p>
        <p className="text-sm text-text-primary/40 mb-6">This reservation could not be found.</p>
        <Link href="/profile/reservations" className="text-primary text-sm font-medium hover:underline">
          Back to Reservations
        </Link>
      </div>
    );
  }

  const { formattedDate, label, isUpcoming, isCancelled } = resolveReservationPresentation(
    rawBooking.booking_date,
    rawBooking.booking_time,
    rawBooking.status
  );

  const details = [
    { icon: CalendarDays, label: 'Date', value: formattedDate },
    { icon: Clock, label: 'Time', value: rawBooking.booking_time },
    { icon: Users, label: 'Guests', value: `${rawBooking.guests} ${rawBooking.guests === 1 ? 'Person' : 'People'}` },
    ...(rawBooking.table_number
      ? [{ icon: MapPin, label: 'Assigned Table', value: `Table ${rawBooking.table_number}${rawBooking.table_preference ? ` (${rawBooking.table_preference})` : ''}` }]
      : rawBooking.table_preference
      ? [{ icon: MapPin, label: 'Seating', value: rawBooking.table_preference }]
      : []),
    ...(rawBooking.occasion && rawBooking.occasion !== 'None' ? [{ icon: PartyPopper, label: 'Occasion', value: rawBooking.occasion }] : []),
    ...(rawBooking.special_requests ? [{ icon: MessageSquare, label: 'Special Requests', value: rawBooking.special_requests }] : []),
  ];

  return (
    <div className="min-h-[calc(100vh-76px)] sm:min-h-[calc(100vh-84px)] bg-obsidian text-text-primary pb-24 md:pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-4 flex items-center gap-3 border-b border-white/5">
        <Link
          href="/profile/reservations"
          aria-label="Back to Reservations"
          className="w-10 h-10 flex items-center justify-center -ml-2 text-text-primary/70 hover:text-text-primary active:scale-95 rounded-full hover:bg-white/5"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-lg font-bold truncate">{rawBooking.id}</h1>
        </div>
        <span
          className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
            isCancelled
              ? 'bg-red-500/15 text-red-400'
              : isUpcoming
              ? 'bg-primary/20 text-primary'
              : 'bg-white/5 text-text-primary/40'
          }`}
        >
          {label}
        </span>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 sm:p-6 space-y-5">
          {details.map(({ icon: Icon, label: fieldLabel, value }) => (
            <div key={fieldLabel} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-text-primary/40 uppercase tracking-wider mb-0.5">{fieldLabel}</p>
                <p className="text-sm text-text-primary font-medium break-words">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/booking"
            className="flex-1 py-3 px-5 rounded-xl bg-primary text-black font-semibold text-sm text-center hover:brightness-110 transition-all"
          >
            Book Another Table
          </Link>
          <Link
            href="/profile/reservations"
            className="flex-1 py-3 px-5 rounded-xl bg-white/5 border border-white/10 text-text-primary font-medium text-sm text-center hover:border-white/20 transition-all"
          >
            All Reservations
          </Link>
        </div>
      </div>
    </div>
  );
}
