'use client';

import Link from 'next/link';
import { Calendar, Users, Clock, ShieldCheck, ChevronRight } from 'lucide-react';

export function BookingCTASection() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="rounded-3xl bg-gradient-to-r from-[#0c2415]/90 via-[#091a10]/85 to-[#06120a]/90 border border-[#d4af37]/30 p-8 sm:p-12 text-center relative overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
        {/* Ambient Gold Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#d4af37]/10 blur-[90px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-[#c5a059]/05 border border-[#d4af37]/40 flex items-center justify-center mb-5 shadow-lg shadow-[#d4af37]/10">
            <Calendar className="w-6 h-6 text-[#d4af37]" />
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            An Unforgettable Evening Awaits
          </h2>

          <p className="text-sm sm:text-base text-white/70 mb-8 font-light max-w-lg leading-relaxed">
            Reserve your intimate dinner or group celebration. Our smart dining room provides instant seating confirmation across all 15 dining tables.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-8 text-xs text-white/60">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#d4af37]" />
              <span>Instant Confirmation</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#3EE094]" />
              <span>Parties 1 to 20 Guests</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#7B93FF]" />
              <span>Guaranteed Reserved Table</span>
            </div>
          </div>

          <Link
            href="/booking"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#c5a059] to-[#a88232] text-black font-bold text-sm shadow-[0_12px_32px_rgba(212,175,55,0.35)] hover:scale-[1.03] active:scale-[0.98] transition-all"
          >
            <span>Book Your Reservation</span>
            <ChevronRight className="w-4 h-4 text-black" />
          </Link>
        </div>
      </div>
    </section>
  );
}
