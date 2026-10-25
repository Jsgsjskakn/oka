'use client';

interface PriceBreakdownCardProps {
  subtotal: number;
  taxRate?: number;
  tip?: number;
}

export function PriceBreakdownCard({ subtotal, taxRate = 0.05, tip = 0 }: PriceBreakdownCardProps) {
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax + tip;
  
  // Calculate effective tip percentage for display if tip is present
  const tipPercent = subtotal > 0 ? Math.round((tip / subtotal) * 100) : 0;

  return (
    <div className="px-4 py-6 border-b border-white/5">
      <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-4">
        Price Summary
      </h3>
      <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 space-y-3">
        <div className="flex justify-between text-sm text-text-primary/70">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-sm text-text-primary/70">
          <span>Tax (GST {(taxRate * 100).toFixed(0)}%)</span>
          <span>₹{tax.toLocaleString('en-IN')}</span>
        </div>
        {tip > 0 && (
          <div className="flex justify-between text-sm text-text-primary/70">
            <span>Tip ({tipPercent}%)</span>
            <span>₹{tip.toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="border-t border-border-subtle pt-3 flex justify-between">
          <span className="text-sm font-semibold text-text-primary">Total</span>
          <span className="text-base font-bold text-primary">₹{total.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
}
