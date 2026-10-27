'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Crown, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';

interface ViewerHeaderProps {
  dishName: string;
  dishSlug?: string;
  dishCategory?: string;
}

export function ViewerHeader({ dishSlug }: ViewerHeaderProps) {
  const totalCartItems = useCartStore((s) => s.getTotalItems());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="fixed top-4 sm:top-6 left-4 sm:left-8 right-4 sm:right-8 z-40 flex items-center justify-between pointer-events-none">
      {/* Top-Left: Back & Brand Pill */}
      <Link
        href="/menu"
        className="pointer-events-auto group inline-flex items-center gap-2.5 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-full bg-[rgba(16,12,9,0.35)] backdrop-blur-xl border border-[rgba(240,195,107,0.35)] hover:border-[#F0C36B] hover:shadow-[0_0_18px_rgba(240,195,107,0.35)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all active:scale-95"
        aria-label="Back to Menu"
      >
        <ArrowLeft className="w-4 h-4 text-[#F0C36B] group-hover:-translate-x-0.5 transition-transform" />
        <Crown className="w-4 h-4 text-[#F0C36B]" />
        <span className="text-xs sm:text-sm font-medium tracking-wide text-[#F8F2E8]">
          3D Food Lounge
        </span>
      </Link>

      {/* Top-Right: Live Cart Drawer / Checkout Pill */}
      <Link
        href="/cart"
        className="pointer-events-auto group inline-flex items-center gap-2.5 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-full bg-[rgba(16,12,9,0.35)] backdrop-blur-xl border border-[rgba(240,195,107,0.35)] hover:border-[#F0C36B] hover:shadow-[0_0_18px_rgba(240,195,107,0.35)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all active:scale-95"
        title="View Cart"
      >
        <ShoppingCart className="w-4 h-4 text-[#F0C36B] group-hover:scale-110 transition-transform" />
        <span className="text-xs sm:text-sm font-medium text-[#F8F2E8]">Cart</span>
        {mounted && totalCartItems > 0 && (
          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#F0C36B] text-[#100C09] text-[11px] font-bold flex items-center justify-center leading-none">
            {totalCartItems > 99 ? '99+' : totalCartItems}
          </span>
        )}
      </Link>
    </header>
  );
}
