'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, Box, Sparkles, Check, Edit3, X } from 'lucide-react';
import type { CartItem } from '@/store/cart-store';
import { toast } from '@/store/toast-store';
import { resolveDishImageUrl } from '@/lib/utils/dish-images';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

export function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const { dish, cartItemId, quantity, size, selectedAddOns, removedIngredients, specialInstructions } = item;

  const itemBasePrice = dish.price + (size?.priceModifier || 0);
  const addOnsPrice = selectedAddOns?.reduce((sum, addon) => sum + addon.price, 0) || 0;
  const unitPrice = itemBasePrice + addOnsPrice;
  const finalPrice = unitPrice * quantity;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [notes, setNotes] = useState(specialInstructions || '');
  const [savedNotes, setSavedNotes] = useState(specialInstructions || '');

  const handleConfirmRemove = () => {
    onRemove(cartItemId);
    toast.info('Item Removed', `${dish.name} removed from your selection`);
  };

  const handleSaveNotes = () => {
    setSavedNotes(notes);
    setShowNotesInput(false);
    toast.success('Chef Instructions Saved', notes ? `"${notes}"` : 'Standard chef preparation');
  };

  const resolvedImage = resolveDishImageUrl(dish.slug, dish.image);

  return (
    <div
      className="relative flex flex-col sm:flex-row gap-4 p-4 sm:p-5 rounded-xl border transition-all duration-300 overflow-hidden shadow-xl"
      style={{
        background: '#15110E',
        borderTop: '1px solid rgba(246, 211, 134, 0.32)',
        borderLeft: '1px solid rgba(226, 168, 75, 0.16)',
        borderRight: '1px solid rgba(226, 168, 75, 0.16)',
        borderBottom: '1px solid rgba(226, 168, 75, 0.16)',
      }}
    >
      {/* Slide-to-Remove Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-30 bg-[#160D0C]/95 backdrop-blur-md border border-rose-500/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs text-[#FAF5EC]">
            <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              Remove <strong>{dish.name}</strong> from your dining selection?
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 rounded-[5px] bg-white/[0.08] hover:bg-white/[0.15] text-xs font-semibold text-[#FAF5EC] transition-colors"
            >
              Keep Dish
            </button>
            <button
              type="button"
              onClick={handleConfirmRemove}
              className="px-3.5 py-1.5 rounded-[5px] bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-md transition-colors"
            >
              Confirm Remove
            </button>
          </div>
        </div>
      )}

      {/* Dish Photo with AR Trigger Badge */}
      <div className="relative w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-lg overflow-hidden shrink-0 bg-black/60 border border-white/10">
        <Link href={`/3d/${dish.slug}`}>
          <Image
            src={resolvedImage}
            alt={dish.name}
            fill
            sizes="88px"
            className="object-cover hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* AR Quick Trigger */}
        <Link
          href={`/ar/${dish.slug}`}
          title="Place Dish on Table in AR"
          className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/85 backdrop-blur-md border border-[#E2A84B]/40 text-[9px] font-mono font-bold text-[#E2A84B] flex items-center gap-1 hover:bg-[#E2A84B] hover:text-[#0D0A08] transition-all z-10 shadow-md"
        >
          <Box className="w-2.5 h-2.5" />
          <span>AR</span>
        </Link>
      </div>

      {/* Item Details */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Header Row: Title & Trash Trigger */}
          <div className="flex justify-between items-start gap-2">
            <Link
              href={`/3d/${dish.slug}`}
              className="font-serif text-lg sm:text-[21px] font-bold text-[#FAF5EC] hover:text-[#E2A84B] transition-colors leading-tight line-clamp-1"
            >
              {dish.name}
            </Link>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1 text-[#9A9286] hover:text-[#F43F5E] transition-colors rounded hover:bg-white/[0.04]"
              title="Remove dish"
              aria-label="Remove dish"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Unit Price Breakdown */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#9A9286] mt-0.5">
            <span>₹{unitPrice} per dish × {quantity}</span>
            {size && (
              <span className="text-[11px] text-[#E2A84B]/80 font-sans">
                ({size.name})
              </span>
            )}
          </div>

          {/* Add-ons & Modifiers if any */}
          {(selectedAddOns?.length || removedIngredients?.length) ? (
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] text-[#A6A095]">
              {selectedAddOns?.map((a) => (
                <span
                  key={a.id}
                  className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/10"
                >
                  +{a.name} (+₹{a.price})
                </span>
              ))}
              {removedIngredients?.map((r) => (
                <span
                  key={r}
                  className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300"
                >
                  No {r}
                </span>
              ))}
            </div>
          ) : null}

          {/* Chef Customization Pill / Row */}
          <div className="mt-2">
            {!showNotesInput ? (
              <button
                type="button"
                onClick={() => setShowNotesInput(true)}
                className="text-[11px] text-[#E2A84B] hover:text-[#FAF5EC] transition-colors inline-flex items-center gap-1.5 group cursor-pointer"
              >
                <Edit3 className="w-3 h-3 group-hover:scale-110 transition-transform" />
                <span className="underline decoration-dotted underline-offset-4">
                  {savedNotes ? `Chef Note: “${savedNotes}” (Edit)` : 'Add Chef Instructions (Spice level, Truffle glaze, No onions...)'}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2 mt-1 max-w-md">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Medium spicy, dressing on side..."
                  className="flex-1 h-7 px-2.5 rounded-[5px] bg-[#0D0A08] border border-[#E2A84B]/40 text-xs text-[#FAF5EC] placeholder:text-[#9A9286]/60 outline-none focus:border-[#E2A84B]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="px-2.5 py-1 rounded-[5px] bg-[#E2A84B] text-[#0D0A08] text-[10.5px] font-bold"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowNotesInput(false)}
                  className="p-1 text-[#9A9286] hover:text-[#FAF5EC]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card Footer: Final Total & Rectangular Architectural Stepper */}
        <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] uppercase font-mono text-[#9A9286]">SUBTOTAL:</span>
            <span className="font-mono text-lg font-bold text-[#FAF5EC]">
              ₹{finalPrice}
            </span>
          </div>

          {/* Architectural Stepper */}
          <div className="flex items-center gap-2 bg-[#0D0A08] rounded-[6px] border border-[#E2A84B]/35 px-1 py-0.5 shadow-inner">
            <button
              type="button"
              onClick={() => onUpdateQuantity(cartItemId, quantity - 1)}
              className="w-6 h-6 flex items-center justify-center text-[#E2A84B] hover:bg-white/[0.08] rounded active:scale-90 transition-all cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3 h-3 stroke-[2.5]" />
            </button>
            <span className="w-6 text-center font-mono text-xs font-bold text-[#FAF5EC] select-none">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(cartItemId, quantity + 1)}
              className="w-6 h-6 flex items-center justify-center text-[#E2A84B] hover:bg-white/[0.08] rounded active:scale-90 transition-all cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
