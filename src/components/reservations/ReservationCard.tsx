'use client';

import Link from 'next/link';
import { ChevronRight, Users } from 'lucide-react';
import { format, parseISO, isFuture } from 'date-fns';
import type { BookingDetails } from '@/types/booking';

interface ReservationCardProps {
  reservation: BookingDetails;
}

export function ReservationCard({ reservation }: ReservationCardProps) {
  const date = parseISO(reservation.date);
  const isUpcoming = isFuture(date);

  return (
    <Link
      href={`/profile/reservations/${reservation.id}`}
      className="block bg-[#1a1a1a] border border-white/5 rounded-xl p-4 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">{reservation.id}</p>
          <p className="text-[10px] text-text-primary/40 mt-0.5">
            {format(date, 'EEEE, MMM d, yyyy')}
          </p>
        </div>
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
          isUpcoming ? 'bg-primary/20 text-primary' : 'bg-white/5 text-text-primary/40'
        }`}>
          {isUpcoming ? 'Upcoming' : 'Past'}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-primary/50">{reservation.time}</span>
          <span className="text-text-primary/20">·</span>
          <span className="flex items-center gap-1 text-xs text-text-primary/50">
            <Users className="w-3 h-3" /> {reservation.guests}
          </span>
          {reservation.tablePreference && reservation.tablePreference !== 'No preference' && (
            <>
              <span className="text-text-primary/20">·</span>
              <span className="text-xs text-text-primary/50">{reservation.tablePreference}</span>
            </>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-text-primary/30" />
      </div>
    </Link>
  );
}
