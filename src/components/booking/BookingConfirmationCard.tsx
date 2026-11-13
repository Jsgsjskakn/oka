'use client';

import {
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  Users,
  CheckCircle2,
  Armchair,
  Sparkles,
} from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { toast } from '@/store/toast-store';
import { RESTAURANT_CONFIG, RESTAURANT_NAME } from '@/lib/config';
import type { BookingDetails } from '@/types/booking';

interface BookingConfirmationCardProps {
  booking: BookingDetails;
}

function formatIcsTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function buildBookingWindow(dateInput: string, timeInput: string): { start: Date; end: Date } {
  const base = parseISO(dateInput);
  const start = isValid(base) ? new Date(base) : new Date();
  const match = timeInput.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match) {
    let hours = Number.parseInt(match[1], 10);
    const mins = Number.parseInt(match[2], 10);
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    start.setHours(hours, mins, 0, 0);
  } else {
    start.setHours(20, 0, 0, 0);
  }
  const end = new Date(start.getTime() + 90 * 60 * 1000);
  return { start, end };
}

export function BookingConfirmationCard({ booking }: BookingConfirmationCardProps) {
  const parsedDate = parseISO(booking.date);
  const formattedDate = isValid(parsedDate)
    ? format(parsedDate, 'EEEE, MMMM d, yyyy')
    : booking.date;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${RESTAURANT_NAME}, ${RESTAURANT_CONFIG.address}`
  )}`;

  const handleAddToCalendar = () => {
    const { start, end } = buildBookingWindow(booking.date, booking.time);
    const summary = `Dinner Reservation at ${RESTAURANT_NAME}`;
    const description = [
      `Guests: ${booking.guests}`,
      booking.tablePreference ? `Table: ${booking.tablePreference}` : null,
      booking.occasion ? `Occasion: ${booking.occasion}` : null,
      booking.id ? `Booking ID: ${booking.id}` : null,
    ]
      .filter(Boolean)
      .join('\\n');

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//The Golden Oak//Reservation//EN',
      'BEGIN:VEVENT',
      `UID:${booking.id || Date.now()}@thegoldenoak.in`,
      `DTSTAMP:${formatIcsTimestamp(new Date())}`,
      `DTSTART:${formatIcsTimestamp(start)}`,
      `DTEND:${formatIcsTimestamp(end)}`,
      `SUMMARY:${summary}`,
      `LOCATION:${RESTAURANT_NAME}, ${RESTAURANT_CONFIG.address}`,
      `DESCRIPTION:${description}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsLines], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `golden-oak-reservation-${booking.id || 'booking'}.ics`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast.success('Calendar Invite Downloaded', 'Booking event saved to your device.');
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto w-full">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 border border-primary/30">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary mb-2">
          Reservation Confirmed
        </h1>
        <p className="text-text-primary/50 text-sm">
          We look forward to hosting you at The Golden Oak.
        </p>
        {booking.id && (
          <div className="mt-4 inline-flex items-center flex-wrap justify-center gap-1.5 bg-[#1a1a1a] border border-border-subtle px-4 py-1.5 rounded-full max-w-full">
            <span className="text-[10px] text-text-primary/50 uppercase tracking-widest">
              Booking ID
            </span>
            <span className="text-xs sm:text-sm font-bold text-primary font-mono break-all">
              {booking.id}
            </span>
          </div>
        )}
      </div>

      <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 shadow-2xl mb-6">
        <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">
          Reservation Details
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-text-primary/40 uppercase tracking-wider mb-0.5">
                Date
              </p>
              <p className="text-sm text-text-primary font-medium">{formattedDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-text-primary/40 uppercase tracking-wider mb-0.5">
                Time
              </p>
              <p className="text-sm text-text-primary font-medium">{booking.time}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-text-primary/40 uppercase tracking-wider mb-0.5">
                Guests
              </p>
              <p className="text-sm text-text-primary font-medium">
                {booking.guests} {booking.guests === 1 ? 'Person' : 'People'}
              </p>
            </div>
          </div>

          {booking.tablePreference && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <Armchair className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-text-primary/40 uppercase tracking-wider mb-0.5">
                  Table / Zone
                </p>
                <p className="text-sm text-text-primary font-medium">
                  {booking.tablePreference}
                </p>
              </div>
            </div>
          )}

          {booking.occasion && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-text-primary/40 uppercase tracking-wider mb-0.5">
                  Occasion
                </p>
                <p className="text-sm text-text-primary font-medium">{booking.occasion}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleAddToCalendar}
          className="w-full min-h-[44px] bg-[#1a1a1a] hover:bg-[#222] border border-border-subtle rounded-xl py-3.5 flex items-center justify-center gap-2 text-sm font-medium text-text-primary transition-colors active:scale-[0.98] cursor-pointer"
        >
          <CalendarDays className="w-4 h-4 text-primary" />
          <span>Add to Calendar</span>
        </button>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[44px] bg-[#1a1a1a] hover:bg-[#222] border border-border-subtle rounded-xl py-3.5 flex items-center justify-center gap-2 text-sm font-medium text-text-primary transition-colors active:scale-[0.98]"
        >
          <MapPin className="w-4 h-4 text-primary" />
          <span>Get Directions</span>
        </a>
        <a
          href={`tel:${RESTAURANT_CONFIG.phone}`}
          className="w-full min-h-[44px] bg-[#1a1a1a] hover:bg-[#222] border border-border-subtle rounded-xl py-3.5 flex items-center justify-center gap-2 text-sm font-medium text-text-primary transition-colors active:scale-[0.98]"
        >
          <Phone className="w-4 h-4 text-primary" />
          <span>Call Restaurant</span>
        </a>
      </div>
    </div>
  );
}
