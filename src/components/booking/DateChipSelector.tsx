'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  format,
  addDays,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfDay,
  nextFriday,
  nextSaturday,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  Sparkles,
  Check,
} from 'lucide-react';

interface DateChipSelectorProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
}

export function DateChipSelector({ selectedDate, onSelect }: DateChipSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(selectedDate));

  const today = useMemo(() => startOfDay(new Date()), []);

  // Close calendar popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Keep viewMonth aligned when selectedDate changes externally
  useEffect(() => {
    setViewMonth(startOfMonth(selectedDate));
  }, [selectedDate]);

  // Dynamic list of dates for the horizontal ribbon (includes today up to 45 days, plus centers on selectedDate)
  const dates = useMemo(() => {
    const totalDays = 45;
    return Array.from({ length: totalDays }).map((_, i) => addDays(today, i));
  }, [today]);

  // Smooth scroll selected card into view
  useEffect(() => {
    if (scrollRef.current) {
      const selectedEl = scrollRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDate]);

  const scrollRibbon = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Calendar Grid Calculation
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd]
  );

  const canGoPrevMonth = !isBefore(subMonths(monthStart, 0), startOfMonth(today));

  const handleSelectSingleDate = (day: Date) => {
    onSelect(startOfDay(day));
    setIsCalendarOpen(false);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Quick 1-Click Single Day Presets
  const quickPicks = [
    { label: 'Today', date: today },
    { label: 'Tomorrow', date: addDays(today, 1) },
    { label: 'This Friday', date: nextFriday(today) },
    { label: 'This Saturday', date: nextSaturday(today) },
  ];

  return (
    <div className="w-full">
      {/* Header Row: SELECT DATE on Left, Interactive Single-Date Picker in Red Box on Right */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 mb-3 relative">
        {/* Left Section Label */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-3.5 h-3.5 text-[#F0C36B]" />
          <h3 className="text-xs font-semibold text-[#F0C36B] tracking-[0.2em] uppercase font-mono">
            SELECT DATE
          </h3>
          <span className="text-[10px] text-[#A99A88] font-mono hidden sm:inline border-l border-white/10 pl-2">
            Single-Day Booking Only
          </span>
        </div>

        {/* RIGHT SECTION: USER REQUESTED RED BOX (Interactive Single-Day Picker + Month Navigation) */}
        <div className="flex items-center gap-2 ml-auto" ref={popoverRef}>
          {/* Main Interactive Single-Date Selector Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border text-xs font-medium transition-all duration-200 active:scale-95 cursor-pointer shadow-lg ${
                isCalendarOpen
                  ? 'bg-[#F0C36B] text-[#17100C] border-[#FFE3A5] shadow-[0_0_20px_rgba(240,195,107,0.5)]'
                  : 'bg-[#18110D]/95 border-[#F0C36B]/70 hover:border-[#F0C36B] text-[#F8F2E8] hover:bg-[#F0C36B]/15 shadow-[0_4px_16px_rgba(0,0,0,0.6),0_0_10px_rgba(240,195,107,0.2)]'
              }`}
              title="Click to open full calendar and select a single date"
              aria-label="Select reservation date"
              aria-expanded={isCalendarOpen}
            >
              <CalendarIcon className={`w-3.5 h-3.5 ${isCalendarOpen ? 'text-[#17100C]' : 'text-[#F0C36B]'}`} />
              <span className={`font-mono text-xs font-bold ${isCalendarOpen ? 'text-[#17100C]' : 'text-[#F8F2E8]'}`}>
                {format(selectedDate, 'EEE, d MMM yyyy')}
              </span>
              <span
                className={`text-[9.5px] uppercase font-mono px-1.5 py-0.5 rounded font-bold border tracking-wider ${
                  isCalendarOpen
                    ? 'bg-[#17100C]/20 text-[#17100C] border-[#17100C]/30'
                    : 'bg-[#F0C36B]/25 text-[#F0C36B] border-[#F0C36B]/40'
                }`}
              >
                1 Day Only
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isCalendarOpen ? 'rotate-180 text-[#17100C]' : 'text-[#F0C36B]'
                }`}
              />
            </button>

            {/* LUXURY CALENDAR POPOVER: Strictly Single Date Selection */}
            {isCalendarOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-[310px] sm:w-[330px] p-4 rounded-2xl border border-[#F0C36B]/50 z-[100] animate-in fade-in zoom-in-95 duration-200 select-none"
                style={{
                  backgroundColor: '#120D0A',
                  boxShadow: '0 25px 60px -10px rgba(0,0,0,0.95), 0 0 0 1px rgba(240,195,107,0.45), inset 0 1px 1px rgba(255,255,255,0.15)',
                }}
              >
                {/* Popover Header: Month / Year & Month Nav Chevrons */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#F0C36B]" />
                    <span className="font-serif text-sm font-bold text-[#F8F2E8] tracking-wide">
                      {format(viewMonth, 'MMMM yyyy')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={!canGoPrevMonth}
                      onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.1] text-[#F0C36B] border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
                      title="Previous Month"
                      aria-label="Previous Month"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.1] text-[#F0C36B] border border-white/10 transition-all active:scale-95 cursor-pointer"
                      title="Next Month"
                      aria-label="Next Month"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quick Single-Day Presets */}
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {quickPicks.map((pick) => {
                    const isPickSelected = isSameDay(pick.date, selectedDate);
                    return (
                      <button
                        key={pick.label}
                        type="button"
                        onClick={() => handleSelectSingleDate(pick.date)}
                        className={`py-1.5 px-1 rounded-lg text-[10.5px] font-medium transition-all text-center cursor-pointer border ${
                          isPickSelected
                            ? 'bg-[#F0C36B] text-[#17100C] font-bold border-[#F0C36B] shadow-sm'
                            : 'bg-white/[0.04] border-white/10 text-[#D1C3B1] hover:text-[#F8F2E8] hover:border-[#F0C36B]/40'
                        }`}
                      >
                        {pick.label}
                      </button>
                    );
                  })}
                </div>

                {/* Day of Week Labels */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <span
                      key={d}
                      className="text-[10px] font-mono font-semibold text-[#F0C36B]/75 uppercase"
                    >
                      {d}
                    </span>
                  ))}
                </div>

                {/* Calendar Days Matrix (Strictly Single Day Selectable) */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, viewMonth);
                    const isPast = isBefore(day, today);
                    const isToday = isSameDay(day, today);

                    if (isPast) {
                      return (
                        <div
                          key={day.toISOString()}
                          className="h-8 flex items-center justify-center text-[11px] font-mono text-[#554A3F] opacity-35 cursor-not-allowed rounded-lg"
                        >
                          {format(day, 'd')}
                        </div>
                      );
                    }

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => handleSelectSingleDate(day)}
                        className={`h-8 w-full flex flex-col items-center justify-center text-xs font-mono rounded-lg transition-all duration-150 cursor-pointer active:scale-90 relative ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#F0C36B] to-[#DDA33E] text-[#17100C] font-bold shadow-[0_0_12px_rgba(240,195,107,0.55)] scale-105'
                            : isCurrentMonth
                            ? 'text-[#F8F2E8] hover:bg-[#F0C36B]/20 hover:text-[#FFE3A5]'
                            : 'text-[#A99A88]/50 hover:bg-white/[0.04]'
                        } ${isToday && !isSelected ? 'border border-[#F0C36B]/50 font-bold' : ''}`}
                      >
                        <span>{format(day, 'd')}</span>
                        {isToday && !isSelected && (
                          <span className="w-1 h-1 rounded-full bg-[#F0C36B] -mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Popover Footer Info */}
                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10.5px] text-[#A99A88]">
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-[#36D6A0]" />
                    <span>Single Day Selected</span>
                  </span>
                  <span className="font-mono text-[#F0C36B]">
                    {format(selectedDate, 'd MMMM yyyy')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Ribbon Horizontal Scroll Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollRibbon('left')}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center bg-[#18110D]/95 hover:bg-[#F0C36B]/20 text-[#F0C36B] border border-[#F0C36B]/40 hover:border-[#F0C36B] active:scale-95 transition-all cursor-pointer shadow-md"
              aria-label="Previous dates in ribbon"
              title="Scroll ribbon earlier"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollRibbon('right')}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center bg-[#18110D]/95 hover:bg-[#F0C36B]/20 text-[#F0C36B] border border-[#F0C36B]/40 hover:border-[#F0C36B] active:scale-95 transition-all cursor-pointer shadow-md"
              aria-label="Next dates in ribbon"
              title="Scroll ribbon later"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizon Date Ribbon (Fully Synchronized, Single Date Highlighted) */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-2.5 pb-2 pt-1 scroll-smooth no-scrollbar snap-x snap-mandatory"
      >
        {dates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);

          return (
            <button
              key={date.toISOString()}
              type="button"
              data-selected={isSelected ? 'true' : undefined}
              onClick={() => handleSelectSingleDate(date)}
              className={`flex flex-col items-center justify-center min-w-[72px] sm:min-w-[76px] py-3 px-2 rounded-xl border snap-start transition-all duration-200 active:scale-95 text-center cursor-pointer ${
                isSelected
                  ? 'text-[#17100C] font-bold shadow-[0_4px_18px_rgba(240,195,107,0.45)] scale-[1.03] border-[#FFE3A5]'
                  : 'bg-white/[0.04] backdrop-blur-md border-white/[0.08] text-[#A99A88] hover:text-[#F8F2E8] hover:border-[#F0C36B]/40 hover:bg-white/[0.07]'
              }`}
              style={
                isSelected
                  ? {
                      background: 'linear-gradient(135deg, #F0C36B 0%, #DDA33E 100%)',
                    }
                  : undefined
              }
              title={`Select ${format(date, 'EEEE, d MMMM yyyy')}`}
              aria-label={`Select ${format(date, 'EEEE, d MMMM yyyy')}`}
            >
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                  isSelected ? 'text-[#17100C]/80 font-bold' : 'text-[#A99A88]'
                }`}
              >
                {format(date, 'EEE')}
              </span>
              <span
                className={`font-mono text-xl sm:text-[22px] font-bold leading-tight ${
                  isSelected ? 'text-[#17100C]' : 'text-[#F8F2E8]'
                }`}
              >
                {format(date, 'd')}
              </span>
              <span
                className={`text-[10px] font-medium mt-0.5 ${
                  isSelected ? 'text-[#17100C]/85 font-semibold' : 'text-[#A99A88]'
                }`}
              >
                {format(date, 'MMM')}
              </span>

              {/* Double availability dots */}
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected
                      ? 'bg-[#17100C]/70'
                      : 'bg-[#36D6A0] shadow-[0_0_6px_#36D6A0]'
                  }`}
                />
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected
                      ? 'bg-[#17100C]/70'
                      : 'bg-[#36D6A0] shadow-[0_0_6px_#36D6A0]'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
