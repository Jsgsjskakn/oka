'use client';

import { Minus, Plus } from 'lucide-react';

interface FixedAddToCartBarProps {
  quantity: number;
  totalPrice: number;
  onQuantityChange: (qty: number) => void;
  onAdd: () => void;
}

export function FixedAddToCartBar({ 
  quantity, 
  totalPrice, 
  onQuantityChange, 
  onAdd 
}: FixedAddToCartBarProps) {
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-border-subtle p-4 pb-safe z-50">
      <div className="flex items-center gap-4">
        
        {/* Quantity Controls */}
        <div className="flex items-center bg-[#1a1a1a] rounded-full p-1 border border-border-subtle shrink-0">
          <button 
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="w-10 h-10 flex items-center justify-center text-text-primary/70 active:scale-95 transition-transform"
            disabled={quantity <= 1}
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center font-medium text-text-primary">
            {quantity}
          </span>
          <button 
            onClick={() => onQuantityChange(quantity + 1)}
            className="w-10 h-10 flex items-center justify-center text-text-primary/70 active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Add to Cart Button */}
        <button 
          onClick={onAdd}
          className="flex-1 bg-primary text-black font-semibold rounded-full py-3.5 px-6 flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <span>Add to Cart</span>
          <span>₹{totalPrice}</span>
        </button>

      </div>
    </div>
  );
}
