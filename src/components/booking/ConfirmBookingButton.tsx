'use client';

import { Loader2 } from 'lucide-react';

interface ConfirmBookingButtonProps {
  disabled: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export function ConfirmBookingButton({ disabled, isLoading, onClick }: ConfirmBookingButtonProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-obsidian/90 backdrop-blur-lg border-t border-white/5 z-50 pb-safe">
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={`w-full h-14 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
          disabled || isLoading
            ? 'bg-[#1a1a1a] text-text-primary/30 cursor-not-allowed'
            : 'bg-primary text-black shadow-[0_0_20px_rgba(201,168,76,0.3)] hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Book Table'}
      </button>
    </div>
  );
}
