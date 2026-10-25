'use client';

interface CartSummaryProps {
  subtotal: number;
  taxRate?: number; // e.g., 0.05 for 5%
}

export function CartSummary({ subtotal, taxRate = 0.05 }: CartSummaryProps) {
  const taxes = Math.round(subtotal * taxRate);
  const total = subtotal + taxes;

  return (
    <div className="bg-[#141414] rounded-xl p-5 border border-white/5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Order Summary</h3>
      
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between text-text-primary/70">
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div>
        <div className="flex justify-between text-text-primary/70">
          <span>Taxes & Fees ({(taxRate * 100).toFixed(0)}%)</span>
          <span>₹{taxes}</span>
        </div>
        
        <div className="h-px bg-white/10 my-1" />
        
        <div className="flex justify-between text-text-primary font-bold text-base">
          <span>Total</span>
          <span className="text-primary">₹{total}</span>
        </div>
      </div>
    </div>
  );
}
