'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, ShoppingCart, Box, Check, Leaf, AlertCircle } from 'lucide-react';
import type { Dish } from '@/types/menu';
import { useCartStore } from '@/store/cart-store';
import { toast } from '@/store/toast-store';

interface DishQuickViewModalProps {
  dish: Dish | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DishQuickViewModal({ dish, isOpen, onClose }: DishQuickViewModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    setQuantity(1);
    setIsAdded(false);
  }, [dish]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !dish) return null;

  const totalPrice = Math.round((dish.price || 0) * quantity);

  const handleAddToCart = () => {
    addItem(dish, quantity);
    setIsAdded(true);
    toast.success('Added to Cart', `${quantity}x ${dish.name} (₹${totalPrice})`);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(15);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Modal Surface */}
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-[rgba(23,16,12,0.96)] border border-[rgba(240,195,107,0.3)] shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-[rgba(13,10,8,0.85)] border border-white/15 text-[#D1C3B1] hover:text-[#F8F2E8] hover:border-[#F0C36B] flex items-center justify-center transition-all cursor-pointer shadow-lg"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: Large Food Image */}
        <div className="relative w-full md:w-1/2 aspect-square md:aspect-auto overflow-hidden bg-black/60 shrink-0">
          <Image
            src={dish.image || '/images/dishes/placeholder.jpg'}
            alt={dish.name}
            fill
            sizes="(max-width: 768px) 100vw, 340px"
            className="object-cover"
          />
          {/* Subtle gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#17100C] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#17100C]" />

          {/* 3D Model Availability Badge */}
          {dish.has3DModel && (
            <Link
              href={`/3d/${dish.slug}`}
              className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(13,10,8,0.85)] backdrop-blur-md border border-[#F0C36B]/40 text-[#F0C36B] text-xs font-semibold hover:border-[#F0C36B] transition-all shadow-lg"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Inspect in 3D &amp; AR</span>
            </Link>
          )}
        </div>

        {/* Right Side: Information & Order Action */}
        <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 space-y-4">
          <div className="space-y-3">
            {/* Category & Veg Badge */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#F0C36B] font-bold">
                {dish.category}
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border text-[10px] font-bold ${
                  dish.isVeg
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                    : 'border-rose-500/30 text-rose-400 bg-rose-500/10'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                {dish.isVeg ? 'Pure Veg' : 'Non-Veg'}
              </span>
            </div>

            {/* Dish Title */}
            <h3 className="font-serif text-2xl sm:text-[26px] font-bold text-[#F8F2E8] leading-tight tracking-tight">
              {dish.name}
            </h3>

            {/* Price */}
            <div className="font-mono text-2xl font-bold text-[#F0C36B]">
              ₹{dish.price}
            </div>

            {/* Description */}
            <p className="text-xs sm:text-[13px] text-[#D1C3B1] font-light leading-relaxed">
              {dish.description}
            </p>

            {/* Verified Ingredients & Highlights */}
            {dish.ingredients && dish.ingredients.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#A59685] font-semibold block mb-1.5">
                  Verified Ingredients &amp; Notes
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {dish.ingredients.map((ing, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-[#D1C3B1]"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls: Stepper & Add Button */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between gap-3">
              {/* Stepper */}
              <div className="flex items-center bg-[#100C09] border border-[rgba(240,195,107,0.25)] rounded-full p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[#F0C36B] hover:bg-[#F0C36B]/10 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center font-mono text-xs sm:text-sm font-bold text-[#F8F2E8]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  disabled={quantity >= 20}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[#F0C36B] hover:bg-[#F0C36B]/10 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Order Button */}
              {isAdded ? (
                <div className="flex-1 h-11 rounded-xl bg-[#0E1F18] border border-[#40C995]/50 text-[#40C995] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(64,201,149,0.3)] animate-in zoom-in-95 duration-200">
                  <Check className="w-4 h-4 text-[#40C995]" />
                  <span>Added to Order</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 h-11 rounded-xl font-bold text-[#17100C] text-xs sm:text-sm tracking-wide transition-all duration-300 hover:brightness-110 active:scale-95 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #F0C36B 0%, #DDA33E 50%, #A8792A 100%)',
                  }}
                >
                  <ShoppingCart className="w-4 h-4 text-[#17100C]" />
                  <span>Add to Order · ₹{totalPrice}</span>
                </button>
              )}
            </div>

            {/* Quick 3D & AR Links */}
            <div className="flex items-center gap-3 w-full pt-1">
              <Link
                href={`/3d/${dish.slug}`}
                className="flex-1 text-center py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-semibold text-[#F8F2E8] hover:text-[#F0C36B] hover:border-[#F0C36B]/40 transition-colors"
              >
                3D Studio
              </Link>
              <Link
                href={`/ar/${dish.slug}`}
                className="flex-1 text-center py-2 rounded-xl bg-[#F0C36B]/15 border border-[#F0C36B]/40 text-xs font-semibold text-[#F0C36B] hover:bg-[#F0C36B]/25 transition-colors flex items-center justify-center gap-1.5"
              >
                <Box className="w-3.5 h-3.5" />
                <span>View in AR</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
