'use client';

import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CartItem } from '@/store/cart-store';
import { toast } from '@/store/toast-store';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

export function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const { dish, cartItemId, quantity, size, selectedAddOns, removedIngredients, specialInstructions } = item;

  const itemBasePrice = dish.price + (size?.priceModifier || 0);
  const addOnsPrice = selectedAddOns?.reduce((sum, addon) => sum + addon.price, 0) || 0;
  const finalPrice = (itemBasePrice + addOnsPrice) * quantity;

  const handleRemove = () => {
    onRemove(cartItemId);
    toast.info('Item Removed', `${dish.name} removed from cart`);
  };

  return (
    <div className="flex gap-4 p-4 sm:p-5 bg-[#09150d]/85 rounded-2xl border border-white/[0.08] hover:border-white/15 transition-all relative shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-black/40">
        <Image
          src={dish.image || '/images/dishes/placeholder.jpg'}
          alt={dish.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h3 className="font-heading text-sm sm:text-base font-bold text-white truncate">
            {dish.name}
          </h3>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 -mr-1 text-white/40 hover:text-rose-400 transition-colors rounded-lg hover:bg-white/[0.05]"
            title="Remove item"
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-0.5 mb-3 text-xs text-white/55">
          {size && (
            <span>
              Size: <strong className="text-white/80 font-medium">{size.name}</strong>
            </span>
          )}
          {selectedAddOns && selectedAddOns.length > 0 && (
            <span>+ {selectedAddOns.map((a) => a.name).join(', ')}</span>
          )}
          {removedIngredients && removedIngredients.length > 0 && (
            <span className="text-rose-400/80">
              No {removedIngredients.join(', No ')}
            </span>
          )}
          {specialInstructions && (
            <span className="italic text-white/40 line-clamp-1">
              &ldquo;{specialInstructions}&rdquo;
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <span className="text-base font-extrabold text-[#d4af37]">
            ₹{finalPrice}
          </span>

          <div className="flex items-center gap-1.5 bg-[#061209] rounded-xl border border-white/10 p-1">
            <button
              type="button"
              onClick={() => onUpdateQuantity(cartItemId, quantity - 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center text-xs font-bold text-white">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(cartItemId, quantity + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
