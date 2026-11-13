'use client';

import { Loader2 } from 'lucide-react';

interface PlaceOrderButtonProps {
  disabled: boolean;
  isLoading: boolean;
  total: number;
  onClick: () => void;
}

function formatRupees(amount: number): string {
  return Number.isInteger(amount)
    ? amount.toLocaleString('en-IN')
    : amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PlaceOrderButton({ disabled, isLoading, total, onClick }: PlaceOrderButtonProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-obsidian/92 backdrop-blur-lg border-t border-white/5 z-50">
      <div className="max-w-md lg:max-w-xl mx-auto w-full">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled || isLoading}
          className={`w-full min-h-[56px] rounded-full flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
            disabled || isLoading
              ? 'bg-[#1a1a1a] text-text-primary/35 cursor-not-allowed'
              : 'bg-primary text-black shadow-[0_0_20px_rgba(201,168,76,0.3)] hover:scale-[1.01] active:scale-[0.98]'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Place Order</span>
              {total > 0 && <span className="opacity-85">· ₹{formatRupees(total)}</span>}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
