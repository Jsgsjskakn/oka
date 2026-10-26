'use client';

import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Tag, Check, ArrowRight } from 'lucide-react';
import { toast } from '@/store/toast-store';

interface CartSummaryProps {
  subtotal: number;
  taxRate?: number;
  totalItems?: number;
}

export function CartSummary({ subtotal, taxRate = 0.05, totalItems = 1 }: CartSummaryProps) {
  const taxes = Math.round(subtotal * taxRate);
  const total = subtotal + taxes;

  const [promoCode, setPromoCode] = useState('');
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCode, setAppliedCode] = useState('');

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = promoCode.trim().toUpperCase();
    if (!clean) return;

    if (clean === 'GOLDEN10' || clean === 'VIP' || clean === 'MICHELIN') {
      const discount = Math.round(subtotal * 0.1);
      setDiscountAmount(discount);
      setAppliedCode(clean);
      setShowPromoInput(false);
      toast.success('Privilege Applied', `10% Concierge Courtesy (₹${discount}) applied to bill.`);
    } else {
      toast.error('Invalid Code', 'The entered privilege code is not valid for this seating.');
    }
  };

  const finalPayable = Math.max(0, total - discountAmount);

  return (
    <div
      className="rounded-2xl p-6 relative overflow-hidden shadow-2xl transition-all"
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
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
        <h3 className="font-serif text-2xl font-bold text-[#FAF5EC]">
          Order Summary
        </h3>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E2A84B]/10 border border-[#E2A84B]/30 text-[10px] font-mono font-bold text-[#E2A84B] tracking-wider uppercase">
          <Sparkles className="w-2.5 h-2.5 text-[#E2A84B]" />
          <span>INSTANT KDS DISPATCH</span>
        </div>
      </div>

      {/* Privilege / Gift Code Collapsible Section */}
      <div className="mb-4 pb-4 border-b border-white/[0.06]">
        {!showPromoInput && !appliedCode ? (
          <button
            type="button"
            onClick={() => setShowPromoInput(true)}
            className="w-full py-2 px-3 rounded-[6px] bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-xs text-[#FAF5EC] hover:text-[#E2A84B] flex items-center justify-between transition-colors cursor-pointer group"
          >
            <span className="flex items-center gap-1.5 text-xs text-[#C9BFB2]">
              <Tag className="w-3.5 h-3.5 text-[#E2A84B]" />
              <span>Have a Dining Privilege or Gift Code?</span>
            </span>
            <span className="text-[11px] font-semibold text-[#E2A84B] group-hover:underline">
              [Apply]
            </span>
          </button>
        ) : appliedCode ? (
          <div className="flex items-center justify-between p-2.5 rounded-[6px] bg-[#22C58B]/10 border border-[#22C58B]/30 text-xs">
            <span className="flex items-center gap-1.5 text-[#22C58B] font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>Privilege: {appliedCode} (-₹{discountAmount})</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setAppliedCode('');
                setDiscountAmount(0);
                setPromoCode('');
              }}
              className="text-[10px] text-rose-400 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyPromo} className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter Code (e.g. VIP, GOLDEN10)"
              className="flex-1 h-8 px-2.5 rounded-[6px] bg-[#0D0A08] border border-[#E2A84B]/40 text-xs font-mono text-[#FAF5EC] uppercase placeholder:normal-case placeholder:text-[#9A9286]/60 outline-none focus:border-[#E2A84B]"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 h-8 rounded-[6px] bg-[#E2A84B] text-[#0D0A08] text-xs font-bold transition-all hover:brightness-110 cursor-pointer"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setShowPromoInput(false)}
              className="px-2 h-8 text-xs text-[#9A9286] hover:text-[#FAF5EC]"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      {/* Bill Breakdown Rows with Monospace Numbers */}
      <div className="flex flex-col gap-3 text-xs sm:text-[13px]">
        <div className="flex justify-between items-center text-[#B5ADA2]">
          <span>
            Items Subtotal ({totalItems} {totalItems === 1 ? 'Dish' : 'Dishes'})
          </span>
          <span className="font-mono text-sm font-semibold text-[#FAF5EC]">
            ₹{subtotal}
          </span>
        </div>

        <div className="flex justify-between items-center text-[#B5ADA2]">
          <span>GST &amp; Artisanal Service ({(taxRate * 100).toFixed(0)}%)</span>
          <span className="font-mono text-sm font-semibold text-[#FAF5EC]">
            ₹{taxes}
          </span>
        </div>

        <div className="flex justify-between items-center text-[#B5ADA2]">
          <span>Packaging / Table Concierge</span>
          <span className="font-mono text-xs font-bold text-[#22C58B] uppercase tracking-wider">
            COMPLIMENTARY
          </span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between items-center text-[#22C58B]">
            <span>Privilege Courtesy Discount</span>
            <span className="font-mono text-sm font-semibold text-[#22C58B]">
              -₹{discountAmount}
            </span>
          </div>
        )}

        {/* Perforated Gold Divider Line */}
        <div className="my-2 border-t border-dashed border-[#E2A84B]/30" />

        {/* Total Payable Row */}
        <div className="flex justify-between items-center pt-1">
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-serif font-bold text-[#FAF5EC]">
              Total Payable
            </span>
            <span className="text-[10px] text-[#9A9286] font-light">
              Inclusive of all duties &amp; artisanal charges
            </span>
          </div>
          <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#E2A84B]">
            ₹{finalPayable}
          </span>
        </div>
      </div>

      {/* Security & Trust Line */}
      <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-center gap-2 text-xs text-[#9A9286]">
        <ShieldCheck className="w-4 h-4 text-[#22C58B] shrink-0" />
        <span className="text-[11px] font-light">
          Protected by 256-Bit Encrypted Checkout · Zero Hidden Charges
        </span>
      </div>
    </div>
  );
}
