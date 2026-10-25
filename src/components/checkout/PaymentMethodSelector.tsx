'use client';

import { Smartphone, Banknote } from 'lucide-react';
import type { PaymentMethod } from '@/types/order';

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

const methods: { value: PaymentMethod; label: string; icon: typeof Smartphone; note?: string }[] = [
  { value: 'upi', label: 'UPI / GPay / PhonePe', icon: Smartphone },
  { value: 'cash', label: 'Cash at Counter', icon: Banknote },
];

export function PaymentMethodSelector({ selected, onSelect }: PaymentMethodSelectorProps) {
  return (
    <div className="px-4 py-6 border-b border-white/5">
      <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-4">
        Payment Method
      </h3>
      <div className="flex flex-col gap-3">
        {methods.map(({ value, label, icon: Icon, note }) => {
          const isSelected = selected === value;
          return (
            <button
              key={value}
              onClick={() => onSelect(value)}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all active:scale-[0.98] ${
                isSelected
                  ? 'bg-primary/10 border-primary/50'
                  : 'bg-[#1a1a1a] border-white/5 hover:border-border-strong'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-primary text-black' : 'bg-white/5 text-text-primary/60'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-sm font-medium flex-1 text-left ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                {label}
              </span>
              {note && (
                <span className="text-[9px] px-2 py-0.5 bg-white/5 text-text-primary/30 rounded-full border border-border-subtle uppercase tracking-wider font-semibold">
                  {note}
                </span>
              )}
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                isSelected ? 'border-primary' : 'border-border-strong'
              }`}>
                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-text-primary/25 mt-3 text-center italic">
        Payment gateway integration coming soon.
      </p>
    </div>
  );
}
