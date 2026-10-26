'use client';

import { useMemo, useRef } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateChipSelectorProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
}

export function DateChipSelector({ selectedDate, onSelect }: DateChipSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const dates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 21 }).map((_, i) => addDays(today, i));
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Format month range for header label
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const monthHeader =
    format(firstDate, 'MMMM yyyy') === format(lastDate, 'MMMM yyyy')
      ? format(firstDate, 'MMMM yyyy')
      : `${format(firstDate, 'MMMM')} / ${format(lastDate, 'MMMM yyyy')}`;

  return (
    <div className="w-full">
      {/* Header with Navigation Arrows and Month Label */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-[#E2A84B] tracking-[0.2em] uppercase">
          Select Date
        </h3>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-[#FAF5EC]/80 mr-1">
            {monthHeader}
          </span>
          <button
            type="button"
            onClick={() => scroll('left')}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-[#E2A84B] border border-white/5 active:scale-95 transition-all"
            aria-label="Previous dates"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-[#E2A84B] border border-white/5 active:scale-95 transition-all"
            aria-label="Next dates"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizon Date Ribbon without grey scrollbar */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-2.5 pb-2 pt-1 scroll-smooth no-scrollbar snap-x snap-mandatory"
      >
        {dates.map((date, idx) => {
          const isSelected = isSameDay(date, selectedDate);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          // Weekend dates fill fast, weekdays high availability
          const isHighAvailability = !isWeekend || idx > 10;

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelect(date)}
              className={`flex flex-col items-center justify-center min-w-[72px] sm:min-w-[76px] py-3 px-2 rounded-xl border snap-start transition-all active:scale-95 text-center cursor-pointer ${
                isSelected
                  ? 'bg-[#0E1F18] border-[1.5px] border-[#E2A84B] shadow-[0_0_15px_rgba(226,168,75,0.25)] -translate-y-0.5'
                  : 'bg-[#16110E] border-white/[0.07] text-[#9A9286] hover:text-[#FAF5EC] hover:border-white/20 hover:bg-[#1C1612]'
              }`}
            >
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                  isSelected ? 'text-[#E2A84B]' : 'text-[#9A9286]'
                }`}
              >
                {format(date, 'EEE')}
              </span>
              <span
                className={`font-mono text-xl sm:text-[22px] font-bold leading-tight ${
                  isSelected ? 'text-[#FAF5EC]' : 'text-[#FAF5EC]/80'
                }`}
              >
                {format(date, 'd')}
              </span>
              <span
                className={`text-[10px] font-medium mt-0.5 ${
                  isSelected ? 'text-[#86EFAC]' : 'text-[#9A9286]'
                }`}
              >
                {format(date, 'MMM')}
              </span>

              {/* 6px Status Dot */}
              <span
                className={`mt-2 w-1.5 h-1.5 rounded-full ${
                  isHighAvailability
                    ? 'bg-[#22C58B] shadow-[0_0_6px_#22C58B]'
                    : 'bg-[#E0532B] shadow-[0_0_6px_#E0532B]'
                }`}
                title={isHighAvailability ? 'High Availability' : 'Filling Fast'}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
