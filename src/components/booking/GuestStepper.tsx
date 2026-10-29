'use client';

import React from 'react';
import { Users } from 'lucide-react';

interface GuestStepperProps {
  guests: number;
  onChange: (guests: number) => void;
}

export function GuestStepper({ guests, onChange }: GuestStepperProps) {
  const partySizes = [
    { size: 1, label: 'Solo' },
    { size: 2, label: 'People' },
    { size: 3, label: 'People' },
    { size: 4, label: 'People' },
    { size: 5, label: 'People' },
    { size: 6, label: 'People' },
    { size: 7, label: 'People' },
    { size: 8, label: 'Group', display: '8+' },
  ];

  const handleSelect = (num: number) => {
    onChange(num);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(8);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-[#F0C36B]" />
          <h3 className="text-xs font-semibold text-[#F0C36B] tracking-[0.2em] uppercase font-mono">
            NUMBER OF GUESTS
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#F8F2E8]/80 font-medium">
          <Users className="w-3.5 h-3.5 text-[#F0C36B]" />
          <span>{guests} {guests === 1 ? 'Guest' : 'Guests'}</span>
        </div>
      </div>

      {/* 8 Quick-Select Tactile Glass Pills */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {partySizes.map((item) => {
          const isSelected = guests === item.size;

          return (
            <button
              key={item.size}
              type="button"
              onClick={() => handleSelect(item.size)}
              className={`py-3 px-1 rounded-xl border text-center transition-all duration-200 active:scale-95 cursor-pointer flex flex-col items-center justify-center ${
                isSelected
                  ? 'text-[#17100C] font-bold shadow-[0_4px_18px_rgba(240,195,107,0.45)] scale-[1.03] border-[#FFE3A5]'
                  : 'bg-[rgba(26,20,16,0.65)] backdrop-blur-md border border-white/10 text-[#FAF5EC] hover:border-[#F0C36B]/50 hover:bg-[rgba(38,30,24,0.85)]'
              }`}
              style={
                isSelected
                  ? {
                      background: 'linear-gradient(135deg, #F0C36B 0%, #DDA33E 100%)',
                    }
                  : undefined
              }
              aria-label={`${item.display || item.size} guests`}
            >
              <span className="font-mono text-base font-bold leading-none">
                {item.display || item.size}
              </span>
              <span
                className={`text-[9.5px] font-medium mt-1 leading-none ${
                  isSelected ? 'text-[#17100C]/85 font-semibold' : 'text-[#D4C7B6] font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
