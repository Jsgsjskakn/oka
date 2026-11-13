'use client';

import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface CartSummaryProps {
  subtotal: number;
  taxRate?: number;
  totalItems?: number;
}

function formatRupees(amount: number): string {
  return Number.isInteger(amount)
    ? amount.toLocaleString('en-IN')
    : amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CartSummary({ subtotal, taxRate = 0.05, totalItems = 1 }: CartSummaryProps) {
  const subtotalPaise = Math.round(subtotal * 100);
  const taxPaise = Math.round(subtotalPaise * taxRate);
  const taxes = taxPaise / 100;
  const total = (subtotalPaise + taxPaise) / 100;

  return (
    <div
      className="rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-2xl transition-all"
      style={{
        background: 'linear-gradient(180deg, #18130F 0%, #100C0A 100%)',
        borderTop: '3px solid #E2A84B',
        borderLeft: '1px solid rgba(226, 168, 75, 0.28)',
        borderRight: '1px solid rgba(226, 168, 75, 0.28)',
        borderBottom: '1px solid rgba(226, 168, 75, 0.28)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
      }}
    >
      {/* Header Row: Title & KDS Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-white/[0.08]">
        <h3 className="font-serif text-2xl font-bold text-[#FAF5EC]">
          Order Summary
        </h3>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E2A84B]/10 border border-[#E2A84B]/30 text-[10px] font-mono font-bold text-[#E2A84B] tracking-wider uppercase">
          <Sparkles className="w-2.5 h-2.5 text-[#E2A84B]" />
          <span>INSTANT KDS DISPATCH</span>
        </div>
      </div>

      {/* Bill Breakdown Rows with Monospace Numbers */}
      <div className="flex flex-col gap-3 text-xs sm:text-[13px]">
        <div className="flex justify-between items-center text-[#B5ADA2]">
          <span>
            Items Subtotal ({totalItems} {totalItems === 1 ? 'Dish' : 'Dishes'})
          </span>
          <span className="font-mono text-sm font-semibold text-[#FAF5EC]">
            ₹{formatRupees(subtotal)}
          </span>
        </div>

        <div className="flex justify-between items-center text-[#B5ADA2]">
          <span>GST &amp; Artisanal Service ({(taxRate * 100).toFixed(0)}%)</span>
          <span className="font-mono text-sm font-semibold text-[#FAF5EC]">
            ₹{formatRupees(taxes)}
          </span>
        </div>

        <div className="flex justify-between items-center text-[#B5ADA2]">
          <span>Packaging / Table Concierge</span>
          <span className="font-mono text-xs font-bold text-[#22C58B] uppercase tracking-wider">
            COMPLIMENTARY
          </span>
        </div>

        {/* Perforated Gold Divider Line */}
        <div className="my-2 border-t border-dashed border-[#E2A84B]/30" />

        {/* Total Payable Row */}
        <div className="flex justify-between items-center pt-1 gap-2">
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-serif font-bold text-[#FAF5EC]">
              Total Payable
            </span>
            <span className="text-[10px] text-[#9A9286] font-light">
              Matches final checkout total · Tips optional next
            </span>
          </div>
          <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#E2A84B] shrink-0">
            ₹{formatRupees(total)}
          </span>
        </div>
      </div>

      {/* Security & Trust Line */}
      <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-center gap-2 text-xs text-[#9A9286] text-center">
        <ShieldCheck className="w-4 h-4 text-[#22C58B] shrink-0" />
        <span className="text-[11px] font-light">
          Protected by 256-Bit Encrypted Checkout · Zero Hidden Charges
        </span>
      </div>
    </div>
  );
}
