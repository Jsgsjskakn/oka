'use client';

import { UtensilsCrossed, ShoppingBag, Bike } from 'lucide-react';
import type { OrderType } from '@/types/order';

interface OrderTypeSelectorProps {
  selected: OrderType;
  onSelect: (type: OrderType) => void;
}

const orderTypes: { value: OrderType; label: string; description: string; icon: typeof UtensilsCrossed }[] = [
  { value: 'dine-in', label: 'Dine In', description: 'Enjoy at our tables', icon: UtensilsCrossed },
  { value: 'takeaway', label: 'Takeaway', description: 'Pick up at counter', icon: ShoppingBag },
  { value: 'delivery', label: 'Delivery', description: 'Direct to your door', icon: Bike },
];

export function OrderTypeSelector({ selected, onSelect }: OrderTypeSelectorProps) {
  return (
    <div className="px-4 py-6 border-b border-white/5">
      <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-4">
        Dining Option
      </h3>
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {orderTypes.map(({ value, label, description, icon: Icon }) => {
          const isSelected = selected === value;
          return (
            <button
              type="button"
              key={value}
              onClick={() => onSelect(value)}
              aria-pressed={isSelected}
              className={`min-h-[52px] flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border transition-all active:scale-[0.97] ${
                isSelected
                  ? 'bg-primary/10 border-primary/50 shadow-[0_0_20px_rgba(201,168,76,0.15)]'
                  : 'bg-[#1a1a1a] border-white/5 hover:border-border-strong'
              }`}
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                isSelected ? 'bg-primary text-black' : 'bg-white/5 text-text-primary/60'
              }`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-center">
                <span className={`block text-xs sm:text-sm font-semibold ${isSelected ? 'text-primary' : 'text-text-primary'}`}>{label}</span>
                <span className="text-[9px] sm:text-[10px] text-text-primary/40 leading-tight hidden xs:block">{description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
