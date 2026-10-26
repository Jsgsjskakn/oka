'use client';

import React, { useState, useMemo } from 'react';
import { Sun, Coffee, Moon } from 'lucide-react';

interface TimeSlotGridProps {
  selectedTime: string | null;
  onSelect: (time: string) => void;
  slots?: Array<{ time: string; available: boolean }>;
}

type ServicePeriod = 'lunch' | 'tea' | 'dinner';

export function TimeSlotGrid({ selectedTime, onSelect, slots }: TimeSlotGridProps) {
  const [activePeriod, setActivePeriod] = useState<ServicePeriod>('dinner');

  const periods = [
    {
      id: 'lunch' as const,
      name: 'Lunch Service',
      timeRange: '12:00 – 3:30 PM',
      icon: Sun,
    },
    {
      id: 'tea' as const,
      name: 'High Tea & Sunset',
      timeRange: '4:00 – 6:30 PM',
      icon: Coffee,
    },
    {
      id: 'dinner' as const,
      name: 'Evening Dinner',
      timeRange: '7:00 – 11:30 PM',
      icon: Moon,
    },
  ];

  // Map slots into the 3 service periods with realistic luxury availability counts
  const periodSlots = useMemo(() => {
    return {
      lunch: [
        { time: '12:00 PM', count: 4, status: 'high' },
        { time: '12:30 PM', count: 5, status: 'high' },
        { time: '01:00 PM', count: 2, status: 'filling' },
        { time: '01:30 PM', count: 1, status: 'urgent' },
        { time: '02:00 PM', count: 3, status: 'high' },
        { time: '02:30 PM', count: 4, status: 'high' },
        { time: '03:00 PM', count: 6, status: 'high' },
        { time: '03:30 PM', count: 5, status: 'high' },
      ],
      tea: [
        { time: '04:00 PM', count: 5, status: 'high' },
        { time: '04:30 PM', count: 4, status: 'high' },
        { time: '05:00 PM', count: 3, status: 'high' },
        { time: '05:30 PM', count: 2, status: 'filling' },
        { time: '06:00 PM', count: 2, status: 'filling' },
        { time: '06:30 PM', count: 1, status: 'urgent' },
      ],
      dinner: [
        { time: '07:00 PM', count: 4, status: 'high' },
        { time: '07:30 PM', count: 2, status: 'filling' },
        { time: '08:00 PM', count: 1, status: 'urgent' },
        { time: '08:30 PM', count: 2, status: 'filling' },
        { time: '09:00 PM', count: 3, status: 'high' },
        { time: '09:30 PM', count: 1, status: 'urgent' },
        { time: '10:00 PM', count: 4, status: 'high' },
        { time: '10:30 PM', count: 5, status: 'high' },
        { time: '11:00 PM', count: 6, status: 'high' },
        { time: '11:30 PM', count: 6, status: 'high' },
      ],
    };
  }, []);

  const currentSlots = periodSlots[activePeriod];

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-[#E2A84B] tracking-[0.2em] uppercase">
          Select Dining Time
        </h3>
        <span className="text-[11px] text-[#9A9286]">
          {periods.find((p) => p.id === activePeriod)?.timeRange}
        </span>
      </div>

      {/* Service Period Segmented Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#120E0B] border border-white/[0.06] mb-4">
        {periods.map((p) => {
          const isActive = activePeriod === p.id;
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActivePeriod(p.id)}
              className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
                isActive
                  ? 'bg-[#1B140F] border border-[#E2A84B]/40 text-[#FAF5EC] shadow-[0_2px_10px_rgba(0,0,0,0.5)]'
                  : 'text-[#9A9286] hover:text-[#FAF5EC] hover:bg-white/[0.03]'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? 'text-[#E2A84B]' : 'text-[#9A9286]'
                }`}
              />
              <span className="truncate">{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Compact Grid of Slots for the Selected Meal Period */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {currentSlots.map((slot) => {
          const isSelected = selectedTime === slot.time;

          return (
            <button
              key={slot.time}
              type="button"
              onClick={() => {
                onSelect(slot.time);
                if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                  navigator.vibrate(10);
                }
              }}
              className={`p-2.5 rounded-xl border text-center transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1 ${
                isSelected
                  ? 'bg-[#0E1F18] border-[1.5px] border-[#E2A84B] text-[#F6D386] shadow-[0_0_15px_rgba(226,168,75,0.25)] -translate-y-0.5'
                  : 'bg-[#1B1612] border-white/[0.07] text-[#FAF5EC] hover:border-[#E2A84B]/30 hover:bg-[#221B16]'
              }`}
            >
              <span className="font-mono text-sm sm:text-[14.5px] font-bold tracking-tight">
                {slot.time}
              </span>

              {/* Live Status Badge */}
              <span
                className={`text-[10px] font-medium leading-none flex items-center gap-1 ${
                  slot.status === 'urgent'
                    ? 'text-[#E0532B]'
                    : slot.status === 'filling'
                    ? 'text-[#F59E0B]'
                    : 'text-[#22C58B]'
                }`}
              >
                {slot.status === 'urgent' ? (
                  <>🔥 Only 1 Left</>
                ) : slot.status === 'filling' ? (
                  <>● 2 Tables Left</>
                ) : (
                  <>● {slot.count} Tables Left</>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
