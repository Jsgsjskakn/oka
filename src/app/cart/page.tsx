'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ShoppingBag, UtensilsCrossed, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart-store';
import { CartItemCard } from '@/components/cart/CartItemCard';
import { CartSummary } from '@/components/cart/CartSummary';
import { EmptyCartState } from '@/components/cart/EmptyCartState';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const [taxRate, setTaxRate] = useState(0.05);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((s) => {
        if (s.tax_rate_percent) setTaxRate(Number(s.tax_rate_percent) / 100);
      })
      .catch(() => {});
  }, []);

  const subtotal = getTotalPrice();

  if (!isMounted) {
    return (
      <div className="min-h-[70vh] bg-[#060e08] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-[#060e08] flex flex-col justify-center items-center px-4 py-16">
        <div className="w-16 h-16 rounded-2xl bg-[#0d2215]/80 border border-[#d4af37]/30 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#d4af37]/10">
          <ShoppingBag className="w-7 h-7 text-[#d4af37]" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-white mb-2">
          Your Dining Cart is Empty
        </h2>
        <p className="text-xs sm:text-sm text-white/60 mb-6 leading-relaxed max-w-sm text-center">
          Explore our gourmet menu and add handcrafted sourdough pizzas, burgers, or signature street fusion.
        </p>
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b38936] text-black font-bold text-xs sm:text-sm shadow-md shadow-[#d4af37]/20 hover:scale-105 active:scale-95 transition-all"
        >
          <UtensilsCrossed className="w-4 h-4 text-black" />
          <span>Explore Menu</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060e08] text-white pb-24">
      {/* Sticky Top Header */}
      <div className="border-b border-white/[0.08] bg-[#061209]/85 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-heading text-lg sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Your Dining Cart</span>
                <span className="text-xs font-normal text-white/50">({items.length} items)</span>
              </h1>
            </div>
          </div>

          <Link
            href="/menu"
            className="text-xs font-medium text-[#d4af37] hover:text-white transition-colors flex items-center gap-1"
          >
            <span>+ Add More Dishes</span>
          </Link>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-7 space-y-4">
            {items.map((item) => (
              <CartItemCard
                key={item.cartItemId}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          {/* Right Column: Sticky Summary & Checkout Action */}
          <div className="lg:col-span-5 lg:sticky lg:top-36 space-y-4">
            <CartSummary subtotal={subtotal} taxRate={taxRate} />

            <button
              onClick={() => router.push('/checkout')}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#c5a059] to-[#a88232] text-black font-extrabold text-sm shadow-[0_12px_28px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>

            <Link
              href="/menu"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#09150d]/80 border border-white/10 text-white/80 hover:text-white font-medium text-xs transition-colors"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Continue Browsing Menu</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
