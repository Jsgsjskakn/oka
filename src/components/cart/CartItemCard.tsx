'use client';

import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CartItem } from '@/store/cart-store';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

export function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const { dish, cartItemId, quantity, size, selectedAddOns, removedIngredients, specialInstructions } = item;

  // Calculate base price including size modifier
  const itemBasePrice = dish.price + (size?.priceModifier || 0);
  
  // Calculate total add-ons price
  const addOnsPrice = selectedAddOns?.reduce((sum, addon) => sum + addon.price, 0) || 0;
  
  // Total item price * quantity
  const finalPrice = (itemBasePrice + addOnsPrice) * quantity;

  return (
    <div className="flex gap-4 p-4 bg-[#1a1a1a] rounded-xl border border-white/5 relative">
      <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0">
        <Image
          src={dish.image || '/images/dishes/placeholder.jpg'}
          alt={dish.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h3 className="font-semibold text-text-primary truncate">
            {dish.name}
          </h3>
          <button 
            onClick={() => onRemove(cartItemId)}
            className="p-1 -m-1 text-text-primary/40 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-0.5 mb-3">
          {size && (
            <span className="text-xs text-text-primary/50">
              Size: {size.name}
            </span>
          )}
          {selectedAddOns && selectedAddOns.length > 0 && (
            <span className="text-xs text-text-primary/50">
              + {selectedAddOns.map(a => a.name).join(', ')}
            </span>
          )}
          {removedIngredients && removedIngredients.length > 0 && (
            <span className="text-xs text-red-400/70">
              - No {removedIngredients.join(', No ')}
            </span>
          )}
          {specialInstructions && (
            <span className="text-[10px] text-text-primary/40 italic line-clamp-1 mt-0.5">
              "{specialInstructions}"
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between">
          <span className="font-semibold text-primary">
            ₹{finalPrice}
          </span>

          <div className="flex items-center bg-[#222] rounded-md border border-white/5">
            <button 
              onClick={() => onUpdateQuantity(cartItemId, quantity - 1)}
              className="w-7 h-7 flex items-center justify-center text-text-primary/70 active:scale-95"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-6 text-center text-xs font-medium text-text-primary">
              {quantity}
            </span>
            <button 
              onClick={() => onUpdateQuantity(cartItemId, quantity + 1)}
              className="w-7 h-7 flex items-center justify-center text-text-primary/70 active:scale-95"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
