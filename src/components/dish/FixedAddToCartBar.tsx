'use client';

import { Minus, Plus } from 'lucide-react';
import { MAX_ITEM_QUANTITY } from '@/store/cart-store';

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
  onAdd,
}: FixedAddToCartBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-border-subtle p-4 pb-[max(1rem,env(safe-area-inset-bottom))] z-50">
      <div className="max-w-3xl mx-auto flex items-center gap-3 sm:gap-4">
        {/* Quantity Controls */}
        <div className="flex items-center bg-[#1a1a1a] rounded-full p-1 border border-border-subtle shrink-0">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            aria-label="Decrease quantity"
            className="w-11 h-11 flex items-center justify-center text-text-primary/70 disabled:opacity-40 active:scale-95 transition-transform"
            disabled={quantity <= 1}
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center font-medium text-text-primary">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => onQuantityChange(Math.min(MAX_ITEM_QUANTITY, quantity + 1))}
            aria-label="Increase quantity"
            className="w-11 h-11 flex items-center justify-center text-text-primary/70 disabled:opacity-40 active:scale-95 transition-transform"
            disabled={quantity >= MAX_ITEM_QUANTITY}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          type="button"
          onClick={onAdd}
          className="flex-1 min-h-[48px] bg-primary text-black font-semibold rounded-full py-3.5 px-6 flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <span>Add to Cart</span>
          <span>₹{totalPrice.toLocaleString('en-IN')}</span>
        </button>
      </div>
    </div>
  );
}
