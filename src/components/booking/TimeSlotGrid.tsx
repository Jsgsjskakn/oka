'use client';

import React, { useState, useMemo } from 'react';
import { Sun, Coffee, Moon, Clock } from 'lucide-react';

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
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#F0C36B]" />
          <h3 className="text-xs font-semibold text-[#F0C36B] tracking-[0.2em] uppercase font-mono">
            SELECT DINING TIME
          </h3>
        </div>
        <span className="text-[11px] text-[#A99A88]">
          {periods.find((p) => p.id === activePeriod)?.timeRange}
        </span>
      </div>

      {/* Service Period Segmented Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/40 backdrop-blur-md border border-white/[0.08] mb-4">
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
                  ? 'bg-[#F0C36B]/20 border border-[#F0C36B] text-[#FFE3A5] shadow-[0_2px_12px_rgba(240,195,107,0.25)]'
                  : 'text-[#A99A88] hover:text-[#F8F2E8] hover:bg-white/[0.04]'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? 'text-[#F0C36B]' : 'text-[#A99A88]'
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
              className={`p-2.5 rounded-xl border text-center transition-all duration-200 active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1 ${
                isSelected
                  ? 'bg-[#F0C36B]/25 border-[1.5px] border-[#F0C36B] text-[#FFE3A5] shadow-[0_0_16px_rgba(240,195,107,0.35)] -translate-y-0.5'
                  : 'bg-white/[0.04] backdrop-blur-md border-white/[0.08] text-[#F8F2E8] hover:border-[#F0C36B]/40 hover:bg-white/[0.07]'
              }`}
            >
              <span className="font-mono text-sm sm:text-[14.5px] font-bold tracking-tight">
                {slot.time}
              </span>

              {/* Live Status Badge */}
              <span
                className={`text-[10px] font-medium leading-none flex items-center gap-1 ${
                  slot.status === 'urgent'
                    ? 'text-[#F0786D]'
                    : slot.status === 'filling'
                    ? 'text-[#F1B94E]'
                    : 'text-[#36D6A0]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    slot.status === 'urgent'
                      ? 'bg-[#F0786D]'
                      : slot.status === 'filling'
                      ? 'bg-[#F1B94E]'
                      : 'bg-[#36D6A0]'
                  }`}
                />
                {slot.status === 'urgent' ? (
                  <>1 Table Left</>
                ) : slot.status === 'filling' ? (
                  <>2 Tables Left</>
                ) : (
                  <>{slot.count} Tables Left</>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
