'use client';

import { UtensilsCrossed } from 'lucide-react';

interface DiningSummaryCardProps {
  tableNumber?: string;
  onTableNumberChange?: (value: string) => void;
  error?: string;
  isPreOrder?: boolean;
}

export function DiningSummaryCard({
  tableNumber = '',
  onTableNumberChange,
  error,
  isPreOrder = false,
}: DiningSummaryCardProps) {
  return (
    <div className="px-4 py-6 border-b border-white/5 space-y-4">
      <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest">
        Dining Details
      </h3>
      <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <UtensilsCrossed className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-text-primary font-medium">
            {isPreOrder ? 'Pre-Order with Table Reservation' : 'Dine-in at The Golden Oak'}
          </p>
          <p className="text-[11px] text-text-primary/45 mt-0.5">
            {isPreOrder
              ? 'Dishes will be freshly timed to your seating arrival'
              : 'Enter your table number if seated, or leave blank to assign on arrival'}
          </p>
        </div>
      </div>

      {onTableNumberChange && (
        <div>
          <label
            htmlFor="checkout-table-number"
            className="block text-[11px] font-medium text-text-primary/70 mb-1.5 ml-1"
          >
            Table Number <span className="text-text-primary/40">(Optional, 1–30)</span>
          </label>
          <input
            id="checkout-table-number"
            type="text"
            inputMode="numeric"
            value={tableNumber}
            onChange={(e) => onTableNumberChange(e.target.value.replace(/\D/g, '').slice(0, 2))}
            placeholder="Leave blank if not seated yet"
            aria-invalid={Boolean(error)}
            className={`w-full min-h-[48px] bg-[#1a1a1a] border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-white/25 focus:outline-none focus:border-primary/50 transition-colors ${
              error ? 'border-red-500' : 'border-border-subtle'
            }`}
          />
          {error && <p className="text-red-400 text-[11px] mt-1 ml-1">{error}</p>}
        </div>
      )}
    </div>
  );
}
