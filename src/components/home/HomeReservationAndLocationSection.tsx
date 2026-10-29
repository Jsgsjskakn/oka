'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  User,
  Users,
  UtensilsCrossed,
  MapPin,
  Star,
  CheckCircle2,
  Shield,
  CreditCard,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Car,
  Wine,
  Crown,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import { useNotificationStore } from '@/store/notification-store';
import { toast } from '@/store/toast-store';
import { StationaryOakTreeBackground } from './StationaryOakTreeBackground';

export function HomeReservationAndLocationSection() {
  const router = useRouter();

  // Reservation Form State
  const [guests, setGuests] = useState<number>(2);
  const [selectedDateLabel, setSelectedDateLabel] = useState<string>('Today, 29 Oct 2026');
  const [timeSlot, setTimeSlot] = useState<string>('8:00 PM');

  // Interactive Dropdown Toggles
  const [showGuestPicker, setShowGuestPicker] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  // Dynamic Date calculation
  useEffect(() => {
    try {
      const today = new Date();
      const dateFormatted = `Today, ${today.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      setSelectedDateLabel(dateFormatted);
    } catch {
      setSelectedDateLabel('Today, 29 Oct 2026');
    }
  }, []);

  // Close dropdowns on outside click
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowGuestPicker(false);
        setShowDatePicker(false);
        setShowTimePicker(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Date options for next 7 days
  const dateOptions = useMemo(() => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const prefix = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      list.push({
        label: `${prefix}, ${d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        value: d.toISOString().split('T')[0],
      });
    }
    return list;
  }, []);

  // Time options
  const timeOptions = [
    { time: '07:00 PM', status: 'Available' },
    { time: '07:30 PM', status: 'Available' },
    { time: '08:00 PM', status: 'Available' },
    { time: '08:30 PM', status: 'Available' },
    { time: '09:00 PM', status: 'Available' },
    { time: '09:30 PM', status: 'Available' },
    { time: '10:00 PM', status: 'Limited' },
  ];

  // Google Maps External URL
  const directionsUrl =
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent('The Golden Oak, 100 Feet Road, Indiranagar, Bengaluru');

  const handleFindTable = () => {
    toast.success(
      'Opening 3D Spatial Canvas',
      `Finding available tables for ${guests} guests on ${selectedDateLabel} at ${timeSlot}...`
    );

    useNotificationStore.getState().addNotification({
      title: 'Table Search Initiated',
      message: `Searching available tables for ${guests} guests at ${timeSlot} on ${selectedDateLabel}.`,
      type: 'table_confirmed',
      category: 'table',
      timestamp: 'Just now',
      actionLabel: 'View in 3D →',
      actionHref: `/booking?guests=${guests}`,
      actionType: 'navigate',
    });

    router.push(
      `/booking?guests=${guests}&date=${encodeURIComponent(selectedDateLabel)}&time=${encodeURIComponent(timeSlot)}`
    );
  };

  const handleCopyAddress = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(
        'The Golden Oak, 45 Golden Oak Boulevard, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038'
      );
      toast.info('Address Copied', 'Copied Indiranagar flagship address to clipboard.');
    }
  };

  return (
    <section className="relative w-full py-16 sm:py-24 overflow-hidden select-none" ref={containerRef}>
      {/* ===================================================================== */}
      {/* STATIONARY THE GOLDEN OAK PARTICLE TREE BACKGROUND (CANVAS)          */}
      {/* Exact particle tree geometry from preloader, staying in one place   */}
      {/* ===================================================================== */}
      <StationaryOakTreeBackground />

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* 2-Card Row Matching Reference Screenshot 100% */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          {/* ========================================================= */}
          {/* CARD 1: RESERVATION & FIND SEATS (7 COLS ON DESKTOP)     */}
          {/* ========================================================= */}
          <div
            className="lg:col-span-7 rounded-2xl sm:rounded-3xl border border-[#D4AF37]/45 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.92),inset_0_1px_1px_rgba(255,255,255,0.18)] flex flex-col sm:flex-row overflow-hidden relative transition-all duration-300 hover:border-[#D4AF37]/70 group"
            style={{
              background:
                'linear-gradient(145deg, rgba(14, 24, 20, 0.84) 0%, rgba(10, 15, 13, 0.88) 60%, rgba(8, 12, 10, 0.92) 100%)',
              backdropFilter: 'blur(20px) saturate(170%)',
              WebkitBackdropFilter: 'blur(20px) saturate(170%)',
            }}
          >
          {/* Subtle Ambient Radial Highlight */}
          <div className="pointer-events-none absolute -top-24 -left-24 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl -z-10" />

          {/* Left Wine Glass & Fine Dining Photo Strip with Vertical Ribbon */}
          <div className="w-full sm:w-[135px] md:w-[155px] h-[160px] sm:h-auto shrink-0 relative overflow-hidden bg-black/60">
            <img
              src="/images/reservation-wine-table-clean.png"
              alt="The Golden Oak Fine Dining Ambience"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90"
              onError={(e) => {
                // Fallback to reservation background if needed
                (e.target as HTMLImageElement).src = '/images/reservation-bg.jpg';
              }}
            />
            {/* Subtle Gradient Fade over Image */}
            <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/40 via-transparent to-[rgba(14,24,20,0.85)] pointer-events-none" />

            {/* Vertical Decorative Ribbon Watermark (Exact Match to Reference) */}
            <div className="absolute top-3 left-3 flex flex-col items-center gap-1.5 pointer-events-none">
              <div className="w-6 h-6 rounded-full bg-black/75 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-md">
                <UtensilsCrossed className="w-3 h-3" />
              </div>
              <span
                className="text-[8.5px] font-mono tracking-[0.28em] text-[#D4AF37]/85 font-semibold uppercase mt-1 select-none"
                style={{
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                }}
              >
                RESERVATION
              </span>
            </div>
          </div>

          {/* Right Main Content Area */}
          <div className="flex-1 p-4 sm:p-5 lg:p-6 flex flex-col justify-between min-w-0">
            {/* Top Bar: Overline Tag + Exclusive Dining Badge */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-3.5 bg-[#D4AF37] rounded-full inline-block" />
                <span className="text-[10.5px] font-mono tracking-[0.22em] text-[#D4AF37] uppercase font-semibold">
                  RESERVATION
                </span>
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/50 border border-[#D4AF37]/35 text-[10.5px] font-medium text-[#FAF5EC] shadow-sm">
                <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                <span>Exclusive Dining</span>
              </div>
            </div>

            {/* Headings */}
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#FAF5EC] tracking-tight leading-tight">
                An Unforgettable Evening Awaits
              </h2>
              <p className="text-xs text-[#A69F94] font-light mt-1 truncate">
                Reserve your table for a truly exceptional dining experience.
              </p>
            </div>

            {/* 3 Input Selector Boxes Side-by-Side */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 my-3 relative">
              {/* 1. Guests Selector Box */}
              <div className="relative">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setShowGuestPicker(!showGuestPicker);
                    setShowDatePicker(false);
                    setShowTimePicker(false);
                  }}
                  className="bg-black/60 hover:bg-black/80 border border-white/12 hover:border-[#F0C36B]/60 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between cursor-pointer transition-all shadow-sm group select-none"
                >
                  <div className="flex items-center justify-between gap-1 text-[#9A9286] group-hover:text-[#F0C36B] transition-colors mb-1">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-[#F0C36B]" />
                      <span className="text-[9.5px] font-mono uppercase tracking-wider">Guests</span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-[#9A9286] group-hover:text-[#F0C36B]" />
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-[#F0C36B] shrink-0" />
                      <span className="text-xs sm:text-[13px] font-bold text-[#FAF5EC] truncate">
                        {guests} Guests
                      </span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-[#9A9286] shrink-0" />
                  </div>
                </div>

                {/* Guests Dropdown Popover */}
                {showGuestPicker && (
                  <div className="absolute top-[calc(100%+6px)] left-0 w-44 z-50 rounded-xl bg-[#120E0B]/95 border border-[#F0C36B]/40 shadow-[0_12px_30px_rgba(0,0,0,0.85)] backdrop-blur-xl p-1.5 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
                    <span className="text-[9.5px] font-mono text-[#F0C36B] uppercase tracking-wider px-2 py-0.5">
                      Select Party Size
                    </span>
                    {[
                      { num: 1, label: '1 Guest (Solo)' },
                      { num: 2, label: '2 Guests (Couple)' },
                      { num: 3, label: '3 Guests (Friends)' },
                      { num: 4, label: '4 Guests (Family)' },
                      { num: 5, label: '5 Guests (Group)' },
                      { num: 6, label: '6 Guests (Group)' },
                      { num: 8, label: '8+ Guests (Party)' },
                    ].map((g) => {
                      const isCur = guests === g.num;
                      return (
                        <button
                          key={g.num}
                          type="button"
                          onClick={() => {
                            setGuests(g.num);
                            setShowGuestPicker(false);
                          }}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all text-left cursor-pointer ${
                            isCur ? 'bg-[#F0C36B] text-black font-bold' : 'text-[#FAF5EC] hover:bg-white/10'
                          }`}
                        >
                          <span>{g.label}</span>
                          {isCur && <span>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Date Selector Box */}
              <div className="relative">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setShowDatePicker(!showDatePicker);
                    setShowGuestPicker(false);
                    setShowTimePicker(false);
                  }}
                  className="bg-black/60 hover:bg-black/80 border border-white/12 hover:border-[#F0C36B]/60 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between cursor-pointer transition-all shadow-sm group select-none"
                >
                  <div className="flex items-center justify-between gap-1 text-[#9A9286] group-hover:text-[#F0C36B] transition-colors mb-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#F0C36B]" />
                      <span className="text-[9.5px] font-mono uppercase tracking-wider">Date</span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-[#9A9286] group-hover:text-[#F0C36B]" />
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs sm:text-[13px] font-semibold text-[#FAF5EC] truncate">
                      {selectedDateLabel}
                    </span>
                    <ChevronDown className="w-3 h-3 text-[#9A9286] shrink-0" />
                  </div>
                </div>

                {/* Date Dropdown Popover */}
                {showDatePicker && (
                  <div className="absolute top-[calc(100%+6px)] left-0 sm:left-auto sm:right-0 w-56 z-50 rounded-xl bg-[#120E0B]/95 border border-[#F0C36B]/40 shadow-[0_12px_30px_rgba(0,0,0,0.85)] backdrop-blur-xl p-1.5 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
                    <span className="text-[9.5px] font-mono text-[#F0C36B] uppercase tracking-wider px-2 py-0.5">
                      Select Dining Date
                    </span>
                    {dateOptions.map((opt, i) => {
                      const isCur = selectedDateLabel === opt.label;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setSelectedDateLabel(opt.label);
                            setShowDatePicker(false);
                          }}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all text-left cursor-pointer ${
                            isCur ? 'bg-[#F0C36B] text-black font-bold' : 'text-[#FAF5EC] hover:bg-white/10'
                          }`}
                        >
                          <span className="truncate">{opt.label}</span>
                          {i === 0 && <span className="text-[9.5px] opacity-75">Today</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Time Selector Box */}
              <div className="relative">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setShowTimePicker(!showTimePicker);
                    setShowGuestPicker(false);
                    setShowDatePicker(false);
                  }}
                  className="bg-black/60 hover:bg-black/80 border border-white/12 hover:border-[#F0C36B]/60 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between cursor-pointer transition-all shadow-sm group select-none"
                >
                  <div className="flex items-center justify-between gap-1 text-[#9A9286] group-hover:text-[#F0C36B] transition-colors mb-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#F0C36B]" />
                      <span className="text-[9.5px] font-mono uppercase tracking-wider">Time</span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-[#9A9286] group-hover:text-[#F0C36B]" />
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs sm:text-[13px] font-semibold text-[#FAF5EC] truncate">
                      {timeSlot} (Available)
                    </span>
                    <ChevronDown className="w-3 h-3 text-[#9A9286] shrink-0" />
                  </div>
                </div>

                {/* Time Dropdown Popover */}
                {showTimePicker && (
                  <div className="absolute top-[calc(100%+6px)] right-0 w-44 z-50 rounded-xl bg-[#120E0B]/95 border border-[#F0C36B]/40 shadow-[0_12px_30px_rgba(0,0,0,0.85)] backdrop-blur-xl p-1.5 flex flex-col gap-1 max-h-56 overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95 duration-150">
                    <span className="text-[9.5px] font-mono text-[#F0C36B] uppercase tracking-wider px-2 py-0.5">
                      Available Seatings
                    </span>
                    {timeOptions.map((opt) => {
                      const isCur = timeSlot === opt.time;
                      return (
                        <button
                          key={opt.time}
                          type="button"
                          onClick={() => {
                            setTimeSlot(opt.time);
                            setShowTimePicker(false);
                          }}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all text-left cursor-pointer ${
                            isCur ? 'bg-[#F0C36B] text-black font-bold' : 'text-[#FAF5EC] hover:bg-white/10'
                          }`}
                        >
                          <span>{opt.time}</span>
                          <span className="text-[9px] text-[#36D6A0]">Available</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Huge Glowing Gold CTA Button */}
            <button
              type="button"
              onClick={handleFindTable}
              className="w-full h-[46px] sm:h-[48px] rounded-xl font-bold text-xs sm:text-sm text-[#161008] tracking-wide flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_8px_25px_rgba(240,195,107,0.45)] hover:shadow-[0_12px_35px_rgba(240,195,107,0.65)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #F5D38B 0%, #E2A84B 50%, #B88226 100%)',
              }}
            >
              <Calendar className="w-4 h-4 text-[#161008]" />
              <span>Find a Table →</span>
            </button>

            {/* 4 Feature Badges at Bottom */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mt-3 pt-3 border-t border-white/[0.08]">
              <div className="px-2 py-1 rounded-full bg-black/40 border border-white/10 text-[10px] sm:text-[10.5px] font-mono text-[#C4B8A8] flex items-center justify-center gap-1.5 truncate">
                <CheckCircle2 className="w-3 h-3 text-[#36D6A0] shrink-0" />
                <span className="truncate">Instant Confirmation</span>
              </div>

              <div className="px-2 py-1 rounded-full bg-black/40 border border-white/10 text-[10px] sm:text-[10.5px] font-mono text-[#C4B8A8] flex items-center justify-center gap-1.5 truncate">
                <Shield className="w-3 h-3 text-[#F0C36B] shrink-0" />
                <span className="truncate">Secure Payment</span>
              </div>

              <div className="px-2 py-1 rounded-full bg-black/40 border border-white/10 text-[10px] sm:text-[10.5px] font-mono text-[#C4B8A8] flex items-center justify-center gap-1.5 truncate">
                <Star className="w-3 h-3 text-[#F0C36B] shrink-0 fill-[#F0C36B]/40" />
                <span className="truncate">Premium Experience</span>
              </div>

              <div className="px-2 py-1 rounded-full bg-black/40 border border-white/10 text-[10px] sm:text-[10.5px] font-mono text-[#C4B8A8] flex items-center justify-center gap-1.5 truncate">
                <RotateCcw className="w-3 h-3 text-[#38BDF8] shrink-0" />
                <span className="truncate">Free Cancellation</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD 2: OUR LOCATION & INTERACTIVE MAP (5 COLS ON DESKTOP)*/}
        {/* ========================================================= */}
        <div
          className="lg:col-span-5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 border border-[#D4AF37]/45 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.92),inset_0_1px_1px_rgba(255,255,255,0.18)] flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-[#D4AF37]/70 group"
          style={{
            background:
              'linear-gradient(145deg, rgba(14, 24, 20, 0.84) 0%, rgba(10, 15, 13, 0.88) 60%, rgba(8, 12, 10, 0.92) 100%)',
            backdropFilter: 'blur(20px) saturate(170%)',
            WebkitBackdropFilter: 'blur(20px) saturate(170%)',
          }}
        >
          {/* Subtle Ambient Radial Highlight */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl -z-10" />

          {/* Top Header: Our Location Badge + Compass North Indicator */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0C36B]/15 border border-[#F0C36B]/40 text-[10.5px] font-mono tracking-[0.2em] uppercase text-[#F0C36B] font-semibold shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-[#F0C36B]" />
              <span>OUR LOCATION</span>
            </div>

            {/* Circular Compass Indicator with N Arrow */}
            <div
              className="w-7 h-7 rounded-full bg-black/60 border border-white/15 flex items-center justify-center text-[11px] font-mono text-[#FAF5EC]/90 shadow-sm"
              title="North Orientation"
            >
              <span className="text-[#F0C36B] font-bold text-[10px]">N</span>
              <span className="text-[9px] text-[#D4AF37] ml-0.5">↑</span>
            </div>
          </div>

          {/* Mid Section: Left Text Details + Right Dark Night Map */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 my-2 items-center flex-1">
            {/* Left Column: Details (7 Cols) */}
            <div className="sm:col-span-7 flex flex-col justify-between h-full space-y-2">
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#FAF5EC] leading-snug">
                  The Golden Oak
                </h3>
                <h4 className="font-serif text-sm sm:text-base font-semibold text-[#FAF5EC]/90 leading-tight">
                  Indiranagar, Bengaluru
                </h4>

                {/* Rating */}
                <div className="flex items-center gap-1.5 text-xs text-[#D4C8B8] font-medium mt-1">
                  <Star className="w-3 h-3 fill-[#F0C36B] text-[#F0C36B]" />
                  <span className="font-bold text-[#FAF5EC]">4.8</span>
                  <span className="text-[#A69F94] font-normal">(1,240+ Verified Diners)</span>
                </div>
              </div>

              {/* Address */}
              <div
                role="button"
                tabIndex={0}
                onClick={handleCopyAddress}
                className="flex items-start gap-1.5 text-[11px] text-[#E8DFD3] font-light leading-relaxed cursor-pointer hover:text-[#F0C36B] transition-colors group/addr"
                title="Click to copy address"
              >
                <MapPin className="w-3.5 h-3.5 text-[#F0C36B] shrink-0 mt-0.5 group-hover/addr:scale-110 transition-transform" />
                <span>
                  45 Golden Oak Boulevard, 100 Feet Road,
                  <br />
                  Indiranagar, Bengaluru, Karnataka 560038
                </span>
              </div>

              {/* Operating Hours */}
              <div className="flex items-start gap-1.5 text-[11px] text-[#A69F94] font-light leading-snug">
                <Clock className="w-3.5 h-3.5 text-[#F0C36B] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider block font-medium">
                    Operating Hours
                  </span>
                  <span>12:00 PM – 11:30 PM (Monday – Sunday)</span>
                </div>
              </div>

              {/* Live Status Indicator */}
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#36D6A0] pt-0.5">
                <span className="w-2 h-2 rounded-full bg-[#36D6A0] animate-pulse" />
                <span>Open at 12:00 PM</span>
                <span className="text-white/40">•</span>
                <span className="text-[#36D6A0]">Online Bookings Open</span>
              </div>
            </div>

            {/* Right Column: Interactive Dark Night Map with Golden Beacon (5 Cols) */}
            <div className="sm:col-span-5 relative rounded-xl overflow-hidden h-[165px] sm:h-[185px] border border-[#F0C36B]/30 shadow-[0_8px_20px_rgba(0,0,0,0.65)] group/map">
              {/* Clean Map Base Image */}
              <img
                src="/images/indiranagar-night-map-clean.png"
                alt="Map of The Golden Oak, 100 Feet Road, Indiranagar"
                className="w-full h-full object-cover group-hover/map:scale-105 transition-transform duration-700"
              />

              {/* Street Names Overlay */}
              <div className="absolute top-2 right-2 text-[8.5px] font-mono text-[#FAF5EC]/70 bg-black/60 px-1.5 py-0.5 rounded border border-white/10 pointer-events-none">
                100 Feet Rd.
              </div>

              {/* Pulsing Golden Oak Pin Beacon */}
              <div className="absolute top-[48%] left-[52%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-[#F0C36B] opacity-50" />
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#F5D38B] to-[#D4AF37] border-2 border-black flex items-center justify-center shadow-[0_0_12px_rgba(240,195,107,0.9)]">
                    <MapPin className="w-3.5 h-3.5 text-black" />
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold text-[#F8F2E8] bg-black/90 px-2 py-0.5 rounded-full border border-[#F0C36B]/60 mt-1 shadow-md whitespace-nowrap">
                  The Golden Oak
                </span>
              </div>

              {/* Metro Station Marker */}
              <div className="absolute bottom-6 left-3 text-[8px] font-mono text-[#38BDF8] bg-black/70 px-1.5 py-0.5 rounded border border-sky-500/30 flex items-center gap-1 pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                <span>Metro Station</span>
              </div>

              {/* View Map Action Button */}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/85 hover:bg-black border border-[#F0C36B]/50 hover:border-[#F0C36B] text-[10px] font-mono text-[#F0C36B] flex items-center gap-1 shadow-md transition-all active:scale-95"
                title="Open Directions in Google Maps"
              >
                <ExternalLink className="w-3 h-3" />
                <span>View Map</span>
              </a>
            </div>
          </div>

          {/* 4 Feature Badges at Bottom */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mt-3 pt-3 border-t border-white/[0.08]">
            <div className="px-2 py-1 rounded-full bg-black/40 border border-white/10 text-[10px] sm:text-[10.5px] font-mono text-[#C4B8A8] flex items-center justify-center gap-1.5 truncate">
              <Car className="w-3 h-3 text-[#F0C36B] shrink-0" />
              <span className="truncate">Complimentary Valet</span>
            </div>

            <div className="px-2 py-1 rounded-full bg-black/40 border border-white/10 text-[10px] sm:text-[10.5px] font-mono text-[#C4B8A8] flex items-center justify-center gap-1.5 truncate">
              <UtensilsCrossed className="w-3 h-3 text-[#F0C36B] shrink-0" />
              <span className="truncate">Wood-Fired Hearth</span>
            </div>

            <div className="px-2 py-1 rounded-full bg-black/40 border border-white/10 text-[10px] sm:text-[10.5px] font-mono text-[#C4B8A8] flex items-center justify-center gap-1.5 truncate">
              <Wine className="w-3 h-3 text-[#F0C36B] shrink-0" />
              <span className="truncate">Sommelier Wine Cellar</span>
            </div>

            <div className="px-2 py-1 rounded-full bg-black/40 border border-white/10 text-[10px] sm:text-[10.5px] font-mono text-[#C4B8A8] flex items-center justify-center gap-1.5 truncate">
              <Crown className="w-3 h-3 text-[#F0C36B] shrink-0" />
              <span className="truncate">Private Dining Suites</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  );
}
