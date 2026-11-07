import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getAllBookings } from '@/lib/services/booking.service';
import { ManageBookingModal } from '@/components/admin/ManageBookingModal';
import { 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle2, 
  CalendarCheck, 
  Phone, 
  PartyPopper, 
  CalendarDays,
  Plus,
  TrendingUp,
} from 'lucide-react';

export const metadata = {
  title: 'Reservations | Admin | The Golden Oak',
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
    <div className="space-y-3 select-none font-sans">
      {/* ===================================================================== */}
      {/* 1. TOP METRIC CARDS: 4 Glowing Dark Glass Cards with Sparklines       */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Confirmed Tables (Emerald Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-emerald-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shadow-inner">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Confirmed Tables</span>
          </div>

          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {confirmedCount}
            </span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="emeraldGradB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 35 Q 20 28, 35 30 T 60 18 T 80 12 T 100 5 L 100 40 L 0 40 Z" fill="url(#emeraldGradB)" />
              <path d="M 0 35 Q 20 28, 35 30 T 60 18 T 80 12 T 100 5" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#34d399]" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold relative z-10">
            <TrendingUp className="w-3 h-3" /> +14% vs. last week
          </div>
        </div>

        {/* Card 2: Total Bookings (Amber Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-amber-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shadow-inner">
              <CalendarCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Total Bookings</span>
          </div>

          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {totalCount}
            </span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="amberGradB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 32 Q 25 35, 45 22 T 75 18 T 100 8 L 100 40 L 0 40 Z" fill="url(#amberGradB)" />
              <path d="M 0 32 Q 25 35, 45 22 T 75 18 T 100 8" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#fbbf24]" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold relative z-10">
            <TrendingUp className="w-3 h-3" /> Live reservations
          </div>
        </div>

        {/* Card 3: Expected Guests (Purple Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-purple-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-purple-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-xs shadow-inner">
              <Users className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Expected Guests</span>
          </div>

          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {totalGuests}
            </span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="purpleGradB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 15 Q 30 18, 50 25 T 80 32 T 100 28 L 100 40 L 0 40 Z" fill="url(#purpleGradB)" />
              <path d="M 0 15 Q 30 18, 50 25 T 80 32 T 100 28" fill="none" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#c084fc]" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-purple-400 font-bold relative z-10">
            Covers Allocated
          </div>
        </div>

        {/* Card 4: Pending Review (Rose Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-rose-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-rose-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-xs shadow-inner">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Pending Review</span>
          </div>

          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {pendingCount}
            </span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="roseGradB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 35 Q 25 30, 45 32 T 75 16 T 100 10 L 100 40 L 0 40 Z" fill="url(#roseGradB)" />
              <path d="M 0 35 Q 25 30, 45 32 T 75 16 T 100 10" fill="none" stroke="#fb7185" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#fb7185]" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-bold relative z-10">
            {pendingCount > 0 ? 'Needs Attention' : 'Queue Cleared'}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. MAIN RESERVATIONS TABLE                                            */}
      {/* ===================================================================== */}
      <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-white/10 p-4 shadow-lg space-y-3.5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-2 border-b border-white/10">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <h2 className="text-sm md:text-base font-bold text-white tracking-wide">
                Reservation Log
              </h2>
              {statusFilter && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize bg-white/10 text-white border border-white/20">
                  {statusFilter}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              Manage dining reservations, party sizes, special occasions, and seating allocations.
            </p>
          </div>

          {/* Quick Filter Pill Group */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              href="/admin/bookings"
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-200 border ${
                !statusFilter 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm' 
                  : 'bg-[#201d27] text-zinc-300 border-white/10 hover:text-white hover:bg-white/10'
              }`}
            >
              All ({totalCount})
            </Link>
            <Link
              href="/admin/bookings?status=confirmed"
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-200 border ${
                statusFilter === 'confirmed'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-[#201d27] text-zinc-300 border-white/10 hover:text-emerald-400 hover:bg-white/10'
              }`}
            >
              Confirmed ({confirmedCount})
            </Link>
            <Link
              href="/admin/bookings?status=pending"
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-200 border ${
                statusFilter === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-[#201d27] text-zinc-300 border-white/10 hover:text-amber-400 hover:bg-white/10'
              }`}
            >
              Pending ({pendingCount})
            </Link>
            <Link
              href="/admin/bookings?status=cancelled"
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-200 border ${
                statusFilter === 'cancelled'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                  : 'bg-[#201d27] text-zinc-300 border-white/10 hover:text-rose-400 hover:bg-white/10'
              }`}
            >
              Cancelled
            </Link>
            <Link
              href="/booking"
              target="_blank"
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[11px] font-medium text-amber-200 transition-colors border border-[#d4af37]/40 ml-1"
            >
              <Plus className="w-3 h-3" />
              <span>Dining Portal</span>
            </Link>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="text-zinc-400 border-b border-white/10 text-[10px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Booking ID</th>
                <th className="px-4 py-3">Guest Details</th>
                <th className="px-4 py-3">Date & Schedule</th>
                <th className="px-4 py-3">Party</th>
                <th className="px-4 py-3">Occasion / Requests</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {bookings?.map((booking: any) => (
                <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px]">
                    <span className="text-amber-200/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-semibold">
                      #{booking.id?.split('-')[0] ?? 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600/30 to-amber-400/30 border border-amber-400/40 flex items-center justify-center text-[10px] font-bold text-amber-200 shrink-0">
                        {(booking.customer_name || booking.guest_name || 'BK').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-xs">
                          {booking.customer_name || booking.guest_name || 'Guest'}
                        </div>
                        {(booking.customer_phone || booking.guest_phone) && (
                          <div className="text-zinc-400 text-[10px] flex items-center gap-1 font-mono">
                            <Phone className="w-2.5 h-2.5 opacity-60" />
                            {booking.customer_phone || booking.guest_phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-[11px] text-white font-medium">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      <span>{new Date(booking.booking_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-amber-300 font-medium mt-0.5">
                      <Clock className="w-2.5 h-2.5 opacity-80" />
                      <span>{booking.booking_time}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 border border-white/10 text-[11px] text-white">
                      <Users className="w-3 h-3 text-zinc-300" />
                      {booking.guests ?? booking.number_of_guests ?? 1} Guests
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {booking.special_requests ? (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-300 max-w-xs truncate">
                        <PartyPopper className="w-2.5 h-2.5 text-amber-300 shrink-0" />
                        <span className="truncate">{booking.special_requests}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-500 text-[11px]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border ${
                      booking.status === 'confirmed'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : booking.status === 'cancelled'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : booking.status === 'completed'
                        ? 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
                        : 'bg-amber-400/20 text-amber-300 border-amber-400/40'
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
                  <td className="px-4 py-3 text-right">
                    <ManageBookingModal booking={booking} />
                  </td>
                </tr>
              ))}
              {(!bookings || bookings.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 shadow-inner">
                        <CalendarDays className="w-5 h-5 stroke-[1.5]" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-white">
                          {statusFilter ? `No ${statusFilter} reservations found` : 'No table reservations recorded yet'}
                        </p>
                        <p className="text-[11px] text-zinc-400 max-w-sm">
                          Customer bookings from the dining portal will sync directly into this live concierge queue.
                        </p>
                      </div>
                      {statusFilter && (
                        <Link 
                          href="/admin/bookings" 
                          className="mt-1 text-[11px] font-semibold text-amber-300 hover:underline"
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
  );
}
