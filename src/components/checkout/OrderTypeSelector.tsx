'use client';

import { UtensilsCrossed, ShoppingBag } from 'lucide-react';
import type { OrderType } from '@/types/order';

interface OrderTypeSelectorProps {
  selected: OrderType;
  onSelect: (type: OrderType) => void;
}

const orderTypes: { value: OrderType; label: string; description: string; icon: typeof UtensilsCrossed }[] = [
  { value: 'dine-in', label: 'Dine In', description: 'Enjoy at our restaurant', icon: UtensilsCrossed },
  { value: 'takeaway', label: 'Takeaway', description: 'Pick up your order', icon: ShoppingBag },
];

export function OrderTypeSelector({ selected, onSelect }: OrderTypeSelectorProps) {
  return (
    <div className="px-4 py-6 border-b border-white/5">
      <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-4">
        Order Type
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {orderTypes.map(({ value, label, description, icon: Icon }) => {
          const isSelected = selected === value;
          return (
            <button
              key={value}
              onClick={() => onSelect(value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all active:scale-[0.97] ${
                isSelected
                  ? 'bg-primary/10 border-primary/50 shadow-[0_0_20px_rgba(201,168,76,0.15)]'
                  : 'bg-[#1a1a1a] border-white/5 hover:border-border-strong'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isSelected ? 'bg-primary text-black' : 'bg-white/5 text-text-primary/60'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-center">
                <span className={`block text-sm font-semibold ${isSelected ? 'text-primary' : 'text-text-primary'}`}>{label}</span>
                <span className="text-[10px] text-text-primary/40">{description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
