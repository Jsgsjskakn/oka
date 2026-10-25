'use client';

import { Minus, Plus, Users } from 'lucide-react';

interface GuestStepperProps {
  guests: number;
  onChange: (guests: number) => void;
}

export function GuestStepper({ guests, onChange }: GuestStepperProps) {
  return (
    <div className="px-4 py-6 border-b border-white/5 flex items-center justify-between">
      <div>
        <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-1">
          Number of Guests
        </h3>
        <p className="text-[10px] text-text-primary/30">Maximum 8 guests</p>
      </div>

      <div className="flex items-center bg-[#1a1a1a] rounded-full p-1 border border-border-subtle">
        <button 
          type="button"
          onClick={() => onChange(Math.max(1, guests - 1))}
          className="w-10 h-10 flex items-center justify-center text-text-primary/70 active:scale-95 transition-transform"
          disabled={guests <= 1}
        >
          <Minus className="w-4 h-4" />
        </button>
        
        <div className="w-12 flex items-center justify-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold text-text-primary">
            {guests}
          </span>
        </div>

        <button 
          type="button"
          onClick={() => onChange(Math.min(8, guests + 1))}
          className="w-10 h-10 flex items-center justify-center text-text-primary/70 active:scale-95 transition-transform"
          disabled={guests >= 8}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
