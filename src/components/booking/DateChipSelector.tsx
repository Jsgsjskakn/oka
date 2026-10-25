'use client';

import { useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';

interface DateChipSelectorProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
}

export function DateChipSelector({ selectedDate, onSelect }: DateChipSelectorProps) {
  const dates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }).map((_, i) => addDays(today, i));
  }, []);

  return (
    <div className="py-6 border-b border-white/5">
      <h3 className="px-4 text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-4">
        Select Date
      </h3>
      <div className="flex overflow-x-auto gap-3 px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
        {dates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          
          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelect(date)}
              className={`flex flex-col items-center justify-center min-w-[72px] p-3 rounded-xl border snap-start transition-colors active:scale-95 ${
                isSelected 
                  ? 'bg-primary border-primary text-black' 
                  : 'bg-[#1a1a1a] border-white/5 text-text-primary/70 hover:text-text-primary'
              }`}
            >
              <span className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isSelected ? 'text-black/70' : 'text-text-primary/40'}`}>
                {format(date, 'EEE')}
              </span>
              <span className="text-xl font-bold">
                {format(date, 'd')}
              </span>
              <span className={`text-[10px] font-medium mt-0.5 ${isSelected ? 'text-black/70' : 'text-text-primary/40'}`}>
                {format(date, 'MMM')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
