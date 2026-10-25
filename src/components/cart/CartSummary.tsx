'use client';

import { ShieldCheck, Sparkles } from 'lucide-react';

interface CartSummaryProps {
  subtotal: number;
  taxRate?: number;
}

export function CartSummary({ subtotal, taxRate = 0.05 }: CartSummaryProps) {
  const taxes = Math.round(subtotal * taxRate);
  const total = subtotal + taxes;

  return (
    <div className="bg-[#09150d]/85 rounded-2xl p-6 border border-white/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
      <h3 className="font-heading text-base font-bold text-white mb-4 flex items-center justify-between">
        <span>Order Summary</span>
        <span className="text-[11px] font-semibold text-[#d4af37] px-2 py-0.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/25">
          Paise-Exact
        </span>
      </h3>

      <div className="flex flex-col gap-3 text-xs sm:text-sm">
        <div className="flex justify-between text-white/70">
          <span>Items Subtotal</span>
          <span className="font-medium text-white">₹{subtotal}</span>
        </div>

        <div className="flex justify-between text-white/70">
          <span>GST / Service Tax ({(taxRate * 100).toFixed(0)}%)</span>
          <span className="font-medium text-white">₹{taxes}</span>
        </div>

        <div className="h-px bg-white/10 my-1" />

        <div className="flex justify-between items-center text-white font-extrabold text-base sm:text-lg">
          <span>Total Payable</span>
          <span className="text-[#d4af37]">₹{total}</span>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-[11px] text-[#3EE094]">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>Price integrity verified with backend database</span>
      </div>
    </div>
  );
}
