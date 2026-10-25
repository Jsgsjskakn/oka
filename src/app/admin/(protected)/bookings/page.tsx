import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getAllBookings } from '@/lib/services/booking.service';
import { ManageBookingModal } from '@/components/admin/ManageBookingModal';
import { 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Filter, 
  CalendarCheck, 
  AlertCircle, 
  ChevronRight,
  Phone,
  PartyPopper,
  CalendarDays
} from 'lucide-react';

export const metadata = {
  title: 'Bookings | Admin | The Golden Oak',
};

const RESTAURANT_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const statusFilter = params.status as 'pending' | 'confirmed' | 'cancelled' | 'completed' | undefined;
  
  // Fetch all bookings for metric stats
  const allBookings = await getAllBookings(RESTAURANT_ID);
  const bookings = statusFilter 
    ? allBookings?.filter(b => b.status === statusFilter)
    : allBookings;

  const totalCount = allBookings?.length ?? 0;
  const confirmedCount = allBookings?.filter(b => b.status === 'confirmed')?.length ?? 0;
  const pendingCount = allBookings?.filter(b => b.status === 'pending')?.length ?? 0;
  const totalGuests = allBookings
    ?.filter(b => b.status === 'confirmed' || b.status === 'pending')
    ?.reduce((sum, b) => sum + (b.guests || 0), 0) ?? 0;

  return (
    <div className="relative min-h-screen p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Background Futuristic Ambient Glow Orbs */}
      <div className="absolute top-12 left-1/4 w-96 h-96 bg-champagne/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-2 border-b border-border-subtle/60">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-platinum/5 text-platinum border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Sparkles className="w-3 h-3 text-platinum" />
              VIP Concierge & Floor Seating
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl heading-ui text-text-primary text-2xl text-transparent bg-clip-text bg-gradient-to-r from-champagne via-platinum to-champagne drop-shadow-[0_0_20px_rgba(201,168,76,0.3)]">
              Table Bookings
            </h1>
            <p className="text-champagne/80 text-[13px] font-medium tracking-[0.05em] uppercase">
              Manage dining reservations, party sizes, special occasions, and seating allocations.
            </p>
          </div>
        </div>

        {/* Quick Filter Pill Group */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/bookings"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 border ${
              !statusFilter 
                ? 'bg-gradient-to-r from-champagne to-platinum text-zinc-950 border-transparent shadow-lg shadow-[#c9a84c]/20' 
                : 'bg-surface/80 text-text-secondary border-border-subtle hover:text-text-primary hover:border-border-strong'
            }`}
          >
            All ({totalCount})
          </Link>
          <Link
            href="/admin/bookings?status=confirmed"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 border ${
              statusFilter === 'confirmed'
                ? 'bg-success/10 text-success border-success/30 shadow-lg shadow-emerald-500/10'
                : 'bg-surface/80 text-text-secondary border-border-subtle hover:text-success hover:border-border-strong'
            }`}
          >
            Confirmed ({confirmedCount})
          </Link>
          <Link
            href="/admin/bookings?status=pending"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 border ${
              statusFilter === 'pending'
                ? 'bg-warning/10 text-warning border-warning/30 shadow-lg shadow-amber-500/10'
                : 'bg-surface/80 text-text-secondary border-border-subtle hover:text-warning hover:border-border-strong'
            }`}
          >
            Pending ({pendingCount})
          </Link>
          <Link
            href="/admin/bookings?status=cancelled"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 border ${
              statusFilter === 'cancelled'
                ? 'bg-danger/10 text-danger border-danger/30 shadow-lg shadow-rose-500/10'
                : 'bg-surface/80 text-text-secondary border-border-subtle hover:text-danger hover:border-border-strong'
            }`}
          >
            Cancelled
          </Link>
        </div>
      </div>

      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {/* 1. Total Reservations */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-border-subtle transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Total Bookings</span>
            <CalendarCheck className="w-4 h-4 text-champagne" />
          </div>
          <p className="text-3xl font-black text-text-primary mt-2">{totalCount}</p>
        </div>

        {/* 2. Confirmed VIP Tables */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-success">Confirmed</span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300 mt-2">
            {confirmedCount}
          </p>
        </div>

        {/* 3. Pending Requests */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-warning">Pending Review</span>
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <p className="text-3xl font-black text-warning mt-2">{pendingCount}</p>
        </div>

        {/* 4. Expected Guests */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-platinum">Total Guests</span>
            <Users className="w-4 h-4 text-platinum" />
          </div>
          <p className="text-3xl font-black text-platinum mt-2">{totalGuests}</p>
        </div>
      </div>

      {/* Bookings Table Container */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 " />
            <h2 className="text-xl font-serif text-text-primary tracking-wide">Reservation Log</h2>
            {statusFilter && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-elevated text-text-secondary border border-border-strong/50">
                Filtered: {statusFilter}
              </span>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(201,168,76,0.15)] hover:shadow-[0_25px_70px_rgba(201,168,76,0.25)] hover:-translate-y-1 transition-all duration-500 hover:border-champagne/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-obsidian/90 text-text-secondary border-b border-border-subtle backdrop-blur-xl">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Booking ID</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Guest Details</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Date & Schedule</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Party</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Occasion / Requests</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-center">Status</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-text-secondary">
                {bookings?.map((booking: any) => (
                  <tr key={booking.id} className="group hover:bg-elevated/40 transition-all duration-300">
                    <td className="px-6 py-4 font-mono text-xs">
                      <span className="text-platinum/90 bg-platinum/5 px-2.5 py-1 rounded-md border border-cyan-500/20 font-medium">
                        #{booking.id?.split('-')[0] ?? 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-platinum/5 border border-cyan-500/20 flex items-center justify-center text-[11px] font-bold text-platinum">
                          {(booking.customer_name || booking.guest_name || 'BK').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-100 group-hover:text-platinum transition-colors">
                            {booking.customer_name || booking.guest_name || 'Guest'}
                          </div>
                          {(booking.customer_phone || booking.guest_phone) && (
                            <div className="text-text-secondary/70 text-xs flex items-center gap-1 mt-0.5 font-mono">
                              <Phone className="w-2.5 h-2.5 opacity-60" />
                              {booking.customer_phone || booking.guest_phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-200">
                        <Calendar className="w-3.5 h-3.5 text-text-secondary/70" />
                        <span>{new Date(booking.booking_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-champagne font-medium mt-0.5">
                        <Clock className="w-3 h-3 opacity-80" />
                        <span>{booking.booking_time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-elevated/80 border border-border-strong/40 text-xs font-medium text-zinc-200">
                        <Users className="w-3.5 h-3.5 text-platinum" />
                        {booking.guests ?? booking.number_of_guests ?? 1} Guests
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {booking.special_requests ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-warning max-w-xs truncate">
                          <PartyPopper className="w-3 h-3 text-warning shrink-0" />
                          <span className="truncate">{booking.special_requests}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border shadow-sm backdrop-blur-sm ${
                        booking.status === 'confirmed'
                          ? 'bg-emerald-500/10 text-success border-emerald-500/25 shadow-emerald-500/10'
                          : booking.status === 'cancelled'
                          ? 'bg-rose-500/10 text-danger border-rose-500/25 shadow-rose-500/10'
                          : booking.status === 'completed'
                          ? 'bg-zinc-500/10 text-text-secondary border-zinc-500/20'
                          : 'bg-amber-400/10 text-warning border-amber-400/25 shadow-amber-400/10'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          booking.status === 'confirmed'
                            ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                            : booking.status === 'cancelled'
                            ? 'bg-rose-400'
                            : booking.status === 'completed'
                            ? 'bg-zinc-400'
                            : 'bg-amber-400 animate-pulse'
                        }`} />
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ManageBookingModal booking={booking} />
                    </td>
                  </tr>
                ))}
                {(!bookings || bookings.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center text-zinc-600 shadow-inner">
                          <CalendarDays className="w-6 h-6 stroke-[1.5]" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-text-secondary">
                            {statusFilter ? `No ${statusFilter} reservations found` : 'No table reservations recorded yet'}
                          </p>
                          <p className="text-xs text-text-secondary/70 max-w-sm">
                            Customer bookings from the dining portal will sync directly into this live concierge queue.
                          </p>
                        </div>
                        {statusFilter && (
                          <Link 
                            href="/admin/bookings" 
                            className="mt-2 text-xs font-semibold text-champagne hover:underline"
                          >
                            Clear Status Filter
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

