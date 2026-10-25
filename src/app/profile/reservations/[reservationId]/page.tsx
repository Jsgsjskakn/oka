import { getBookingById } from '@/lib/services/booking.service';
import { ChevronLeft, CalendarDays, Clock, Users, MapPin, PartyPopper, MessageSquare } from 'lucide-react';
import { format, parseISO, isFuture } from 'date-fns';
import Link from 'next/link';

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ reservationId: string }>;
}) {
  const { reservationId } = await params;
  const rawBooking = await getBookingById(reservationId);

  if (!rawBooking) {
    return (
      <div className="min-h-screen bg-obsidian text-text-primary flex flex-col items-center justify-center px-8">
        <p className="text-lg font-semibold mb-2">Reservation Not Found</p>
        <p className="text-sm text-text-primary/40 mb-6">This reservation could not be found.</p>
        <Link href="/profile/reservations" className="text-primary text-sm font-medium">
          Go Back
        </Link>
      </div>
    );
  }

  let isoDate = rawBooking.booking_date;
  try {
    const d = new Date(rawBooking.booking_date);
    if (!isNaN(d.getTime())) {
      isoDate = d.toISOString();
    }
  } catch {}

  const date = parseISO(isoDate);
  const isUpcoming = isFuture(date);

  const details = [
    { icon: CalendarDays, label: 'Date', value: format(date, 'EEEE, MMMM d, yyyy') },
    { icon: Clock, label: 'Time', value: rawBooking.booking_time },
    { icon: Users, label: 'Guests', value: `${rawBooking.guests} ${rawBooking.guests === 1 ? 'Person' : 'People'}` },
    ...(rawBooking.table_preference ? [{ icon: MapPin, label: 'Seating', value: rawBooking.table_preference }] : []),
    ...(rawBooking.occasion && rawBooking.occasion !== 'None' ? [{ icon: PartyPopper, label: 'Occasion', value: rawBooking.occasion }] : []),
    ...(rawBooking.special_requests ? [{ icon: MessageSquare, label: 'Special Requests', value: rawBooking.special_requests }] : []),
  ];

  return (
    <div className="min-h-screen bg-obsidian text-text-primary pb-8">
      <div className="px-4 py-5 flex items-center gap-3 border-b border-white/5 sticky top-0 bg-obsidian z-40">
        <Link
          href="/profile/reservations"
          className="w-10 h-10 flex items-center justify-center -ml-2 text-text-primary/70 hover:text-text-primary active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <h1 className="font-heading text-lg font-bold">{rawBooking.id}</h1>
        </div>
        <span
          className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
            isUpcoming ? 'bg-primary/20 text-primary' : 'bg-white/5 text-text-primary/40'
          }`}
        >
          {isUpcoming ? 'Upcoming' : 'Past'}
        </span>
      </div>

      <div className="max-w-md mx-auto w-full px-4 py-6">
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-5">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-text-primary/40 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-sm text-text-primary font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
