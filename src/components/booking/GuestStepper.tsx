'use client';

import React from 'react';
import { Users, Minus, Plus } from 'lucide-react';

interface GuestStepperProps {
  guests: number;
  onChange: (guests: number) => void;
}

export function GuestStepper({ guests, onChange }: GuestStepperProps) {
  const partySizes = [1, 2, 3, 4, 5, 6, 7, 8];

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
          <Users className="w-4 h-4 text-[#E2A84B]" />
          <h3 className="text-xs font-semibold text-[#E2A84B] tracking-[0.2em] uppercase">
            Number of Guests
          </h3>
        </div>
        <span className="text-[11px] font-mono font-semibold text-[#FAF5EC]/70">
          {guests} {guests === 1 ? 'Guest' : guests >= 8 ? 'Guests (VIP Booth)' : 'Guests'}
        </span>
      </div>

      {/* 8 Quick-Select Tactile Pills */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {partySizes.map((size) => {
          const isSelected = guests === size;
          const isVip = size === 8;

          return (
            <button
              key={size}
              type="button"
              onClick={() => handleSelect(size)}
              className={`py-3 px-1 rounded-xl border text-center transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center ${
                isSelected
                  ? 'text-[#0D0A08] font-bold shadow-[0_4px_16px_rgba(226,168,75,0.45)] scale-105 border-white/60'
                  : 'bg-[#16110E] border-white/[0.07] text-[#FAF5EC] hover:border-[#E2A84B]/40 hover:bg-[#1E1612]'
              }`}
              style={
                isSelected
                  ? {
                      background:
                        'linear-gradient(135deg, #F6D386 0%, #D49432 100%)',
                    }
                  : undefined
              }
              aria-label={`${size} guests`}
            >
              <span className="font-mono text-base font-bold leading-none">
                {isVip ? '8+' : size}
              </span>
              <span
                className={`text-[9px] font-medium mt-1 leading-none ${
                  isSelected ? 'text-[#0D0A08]/80 font-semibold' : 'text-[#9A9286]'
                }`}
              >
                {isVip ? 'VIP' : size === 1 ? 'Solo' : size === 2 ? 'Pair' : 'Table'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
