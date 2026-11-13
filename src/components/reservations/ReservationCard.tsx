'use client';

import Link from 'next/link';
import { ChevronRight, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { BookingDetails } from '@/types/booking';

export function resolveReservationPresentation(
  dateStr: string,
  timeStr?: string,
  status?: string
): { formattedDate: string; label: string; isUpcoming: boolean; isCancelled: boolean } {
  const normalizedStatus = (status || '').toLowerCase();
  const isCancelled = normalizedStatus === 'cancelled';

  let parsed = new Date(dateStr);
  try {
    const iso = parseISO(dateStr);
    if (!isNaN(iso.getTime())) parsed = iso;
  } catch {
    // keep fallback Date
  }

  const validDate = !isNaN(parsed.getTime());
  const formattedDate = validDate ? format(parsed, 'EEEE, MMM d, yyyy') : dateStr;

  let isUpcoming = false;
  if (validDate && !isCancelled && normalizedStatus !== 'completed') {
    const dt = new Date(parsed.getTime());
    const match = (timeStr || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const mins = parseInt(match[2], 10);
      const mer = match[3]?.toUpperCase();
      if (mer === 'PM' && hours < 12) hours += 12;
      if (mer === 'AM' && hours === 12) hours = 0;
      dt.setHours(hours, mins, 0, 0);
    } else {
      dt.setHours(23, 59, 59, 999);
    }
    isUpcoming = dt.getTime() >= Date.now();
  }

  const label = isCancelled
    ? 'Cancelled'
    : normalizedStatus === 'completed'
    ? 'Completed'
    : normalizedStatus === 'seated'
    ? 'Seated'
    : isUpcoming
    ? 'Upcoming'
    : 'Past';

  return { formattedDate, label, isUpcoming, isCancelled };
}

interface ReservationCardProps {
  reservation: BookingDetails & { status?: string; tableNumber?: number | null };
}

export function ReservationCard({ reservation }: ReservationCardProps) {
  const { formattedDate, label, isUpcoming, isCancelled } = resolveReservationPresentation(
    reservation.date,
    reservation.time,
    reservation.status
  );

  return (
    <Link
      href={`/profile/reservations/${reservation.id}`}
      className="block bg-[#1a1a1a] border border-white/5 hover:border-primary/30 rounded-xl p-4 active:scale-[0.98] transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">{reservation.id}</p>
          <p className="text-[10px] text-text-primary/40 mt-0.5">
            {formattedDate}
          </p>
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

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
          <span className="text-xs text-text-primary/50">{reservation.time}</span>
          <span className="text-text-primary/20">·</span>
          <span className="flex items-center gap-1 text-xs text-text-primary/50">
            <Users className="w-3 h-3" /> {reservation.guests}
          </span>
          {reservation.tableNumber && (
            <>
              <span className="text-text-primary/20">·</span>
              <span className="text-xs text-primary font-medium">T{reservation.tableNumber}</span>
            </>
          )}
          {reservation.tablePreference && reservation.tablePreference !== 'No preference' && (
            <>
              <span className="text-text-primary/20">·</span>
              <span className="text-xs text-text-primary/50 truncate">{reservation.tablePreference}</span>
            </>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-text-primary/30 shrink-0" />
      </div>
    </Link>
  );
}
