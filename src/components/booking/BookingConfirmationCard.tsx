'use client';

import { CalendarDays, Clock, MapPin, Phone, Users, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { BookingDetails } from '@/types/booking';

interface BookingConfirmationCardProps {
  booking: BookingDetails;
}

export function BookingConfirmationCard({ booking }: BookingConfirmationCardProps) {
  const parsedDate = parseISO(booking.date);

  return (
    <div className="px-4 py-8 max-w-md mx-auto w-full">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 border border-primary/30">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">Reservation Confirmed</h1>
        <p className="text-text-primary/50 text-sm">We look forward to hosting you at The Golden Oak.</p>
        <div className="mt-4 inline-block bg-[#1a1a1a] border border-border-subtle px-4 py-1.5 rounded-full">
          <span className="text-[10px] text-text-primary/50 uppercase tracking-widest mr-2">Booking ID</span>
          <span className="text-sm font-bold text-primary">{booking.id}</span>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 shadow-2xl mb-6">
        <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">Reservation Details</h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-text-primary/40 uppercase tracking-wider mb-0.5">Date</p>
              <p className="text-sm text-text-primary font-medium">{format(parsedDate, 'EEEE, MMMM d, yyyy')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-text-primary/40 uppercase tracking-wider mb-0.5">Time</p>
              <p className="text-sm text-text-primary font-medium">{booking.time}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-text-primary/40 uppercase tracking-wider mb-0.5">Guests</p>
              <p className="text-sm text-text-primary font-medium">{booking.guests} {booking.guests === 1 ? 'Person' : 'People'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button className="w-full bg-[#1a1a1a] hover:bg-[#222] border border-border-subtle rounded-xl py-3.5 flex items-center justify-center gap-2 text-sm font-medium text-text-primary transition-colors active:scale-[0.98]">
          <CalendarDays className="w-4 h-4 text-primary" />
          Add to Calendar
        </button>
        <button className="w-full bg-[#1a1a1a] hover:bg-[#222] border border-border-subtle rounded-xl py-3.5 flex items-center justify-center gap-2 text-sm font-medium text-text-primary transition-colors active:scale-[0.98]">
          <MapPin className="w-4 h-4 text-primary" />
          Get Directions
        </button>
        <button className="w-full bg-[#1a1a1a] hover:bg-[#222] border border-border-subtle rounded-xl py-3.5 flex items-center justify-center gap-2 text-sm font-medium text-text-primary transition-colors active:scale-[0.98]">
          <Phone className="w-4 h-4 text-primary" />
          Call Restaurant
        </button>
      </div>
    </div>
  );
}
