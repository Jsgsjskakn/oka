'use client';

import { useState } from 'react';
import Link from 'next/link';

export function BookingCTASection() {
  const [guests, setGuests] = useState('2');
  const [date, setDate] = useState('today');
  const [timeSlot, setTimeSlot] = useState('20:00');

  return (
    // Interactive Concierge Booking Bar
    <section className="px-4 sm:px-8 lg:px-10 py-10 max-w-[1180px] mx-auto w-full select-none">
      <div
        className="rounded-2xl border p-6 sm:p-8 lg:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(243,229,171,0.22)] relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(16, 26, 21, 0.96) 0%, rgba(18, 14, 11, 0.98) 55%, rgba(10, 8, 6, 1) 100%)',
          borderColor: 'rgba(212, 175, 55, 0.28)',
        }}
      >
        {/* Subtle Radial Glow & Top Highlight */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'rgba(212, 175, 55, 0.12)' }}
        />
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#F3E5AB]/30 to-transparent" />

        {/* Top Half: Left Heading + Right Architectural Stats with Clean Dividers */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/[0.07]">
          <div>
            <span className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37] font-semibold block mb-2">
              RESERVE YOUR TABLE · SANCTUARY
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#FAF5EC] tracking-tight">
              An Unforgettable Evening Awaits
            </h2>
          </div>

          {/* Clean Dividers Stats */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[#B5ADA2]">
            <span>Instant Confirmation</span>
            <span className="text-[#D4AF37]/40">·</span>
            <span>Parties 1–20</span>
            <span className="text-[#D4AF37]/40">·</span>
            <span>15 Smart Tables</span>
          </div>
        </div>

        {/* Bottom Half: 4-Column Luxury Selector Strip */}
        <div
          className="mt-6 p-2.5 sm:p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 items-center rounded-xl border"
          style={{
            background: 'rgba(10, 8, 6, 0.85)',
            borderColor: 'rgba(212, 175, 55, 0.25)',
          }}
        >
          {/* Selector 1: Guests */}
          <div className="px-4 py-2.5 rounded-md bg-white/[0.03] border border-white/[0.06] flex flex-col justify-center">
            <label htmlFor="concierge-guests-select" className="text-[10px] uppercase tracking-wider text-[#9A9286] font-medium">
              GUESTS
            </label>
            <select
              id="concierge-guests-select"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="bg-transparent text-sm font-semibold text-[#FAF5EC] focus:outline-none cursor-pointer mt-0.5"
            >
              <option value="1" className="bg-[#0D0A08] text-[#FAF5EC]">1 Guest</option>
              <option value="2" className="bg-[#0D0A08] text-[#FAF5EC]">2 Guests</option>
              <option value="4" className="bg-[#0D0A08] text-[#FAF5EC]">4 Guests</option>
              <option value="6" className="bg-[#0D0A08] text-[#FAF5EC]">6 Guests</option>
              <option value="8" className="bg-[#0D0A08] text-[#FAF5EC]">8+ Guests</option>
            </select>
          </div>

          {/* Selector 2: Date */}
          <div className="px-4 py-2.5 rounded-md bg-white/[0.03] border border-white/[0.06] flex flex-col justify-center">
            <label htmlFor="concierge-date-select" className="text-[10px] uppercase tracking-wider text-[#9A9286] font-medium">
              DATE
            </label>
            <select
              id="concierge-date-select"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-sm font-semibold text-[#FAF5EC] focus:outline-none cursor-pointer mt-0.5"
            >
              <option value="today" className="bg-[#0D0A08] text-[#FAF5EC]">Today, Evening</option>
              <option value="tomorrow" className="bg-[#0D0A08] text-[#FAF5EC]">Tomorrow, Dinner</option>
              <option value="weekend" className="bg-[#0D0A08] text-[#FAF5EC]">This Weekend</option>
            </select>
          </div>

          {/* Selector 3: Time Slot with #22C58B Jade Mint Live Dot */}
          <div className="px-4 py-2.5 rounded-md bg-white/[0.03] border border-white/[0.06] flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <label htmlFor="concierge-timeslot-select" className="text-[10px] uppercase tracking-wider text-[#9A9286] font-medium">
                TIME SLOT
              </label>
              <span className="flex items-center gap-1 text-[9px] text-[#22C58B] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C58B] animate-pulse" />
                Live
              </span>
            </div>
            <select
              id="concierge-timeslot-select"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="bg-transparent text-sm font-semibold text-[#FAF5EC] focus:outline-none cursor-pointer mt-0.5"
            >
              <option value="19:00" className="bg-[#0D0A08] text-[#FAF5EC]">7:00 PM (Available)</option>
              <option value="19:30" className="bg-[#0D0A08] text-[#FAF5EC]">7:30 PM (Available)</option>
              <option value="20:00" className="bg-[#0D0A08] text-[#FAF5EC]">8:00 PM (Available)</option>
              <option value="20:30" className="bg-[#0D0A08] text-[#FAF5EC]">8:30 PM (Available)</option>
              <option value="21:00" className="bg-[#0D0A08] text-[#FAF5EC]">9:00 PM (Available)</option>
            </select>
          </div>

          {/* Selector 4: Molten Gold CTA Button */}
          <Link
            href={`/booking?guests=${guests}&time=${timeSlot}`}
            className="w-full h-full min-h-[48px] inline-flex items-center justify-center gap-2 px-6 text-sm font-bold text-[#0D0A08] transition-all duration-300 hover:brightness-110 active:scale-[0.98] shadow-md group"
            style={{
              background: 'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
              borderRadius: '6px',
            }}
          >
            <span>Find a Table</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
