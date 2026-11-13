'use client';

interface PriceBreakdownCardProps {
  subtotal: number;
  taxRate?: number;
  tip?: number;
  discount?: number;
  promoCode?: string;
}

function formatRupees(amount: number): string {
  return Number.isInteger(amount)
    ? amount.toLocaleString('en-IN')
    : amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PriceBreakdownCard({
  subtotal,
  taxRate = 0.05,
  tip = 0,
  discount = 0,
  promoCode,
}: PriceBreakdownCardProps) {
  const subtotalPaise = Math.round(subtotal * 100);
  const discountPaise = Math.min(subtotalPaise, Math.round(discount * 100));
  const effectiveSubtotalPaise = Math.max(0, subtotalPaise - discountPaise);
  const taxPaise = Math.round(effectiveSubtotalPaise * taxRate);
  const tipPaise = Math.round(tip * 100);
  const tax = taxPaise / 100;
  const total = (effectiveSubtotalPaise + taxPaise + tipPaise) / 100;

  const tipPercent = subtotal > 0 ? Math.round((tip / subtotal) * 100) : 0;

  return (
    <div className="px-4 py-6 border-b border-white/5">
      <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-4">
        Price Summary
      </h3>
      <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 space-y-3">
        <div className="flex justify-between text-sm text-text-primary/70">
          <span>Subtotal</span>
          <span>₹{formatRupees(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-[#22C58B]">
            <span className="flex items-center gap-1.5 font-medium">
              <span>Discount</span>
              {promoCode && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#22C58B]/15 border border-[#22C58B]/30">
                  {promoCode}
                </span>
              )}
            </span>
            <span className="font-mono font-semibold">-₹{formatRupees(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-text-primary/70">
          <span>Tax (GST {(taxRate * 100).toFixed(0)}%)</span>
          <span>₹{formatRupees(tax)}</span>
        </div>
        {tip > 0 && (
          <div className="flex justify-between text-sm text-text-primary/70">
            <span>Tip ({tipPercent}%)</span>
            <span>₹{formatRupees(tip)}</span>
          </div>
        )}
        <div className="border-t border-border-subtle pt-3 flex justify-between items-baseline">
          <span className="text-sm font-semibold text-text-primary">Total</span>
          <span className="text-base sm:text-lg font-bold text-primary font-mono">₹{formatRupees(total)}</span>
        </div>
      </div>
    </div>
  );
}
