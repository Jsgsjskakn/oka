'use client';

import { UtensilsCrossed } from 'lucide-react';

export function DiningSummaryCard() {
  return (
    <div className="px-4 py-6 border-b border-white/5">
      <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-4">
        Dining Details
      </h3>
      <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <UtensilsCrossed className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-text-primary font-medium">Dine-in at The Golden Oak</p>
          <p className="text-[10px] text-text-primary/40 mt-0.5">Table will be assigned upon arrival</p>
        </div>
      </div>
    </div>
  );
}
