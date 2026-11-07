'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Crown, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';

interface ViewerHeaderProps {
  dishName: string;
  dishSlug?: string;
  dishCategory?: string;
  children?: React.ReactNode;
}

export function ViewerHeader({ dishSlug, children }: ViewerHeaderProps) {
  const totalCartItems = useCartStore((s) => s.getTotalItems());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="fixed top-2.5 sm:top-4 left-2 sm:left-6 right-2 sm:right-6 z-40 flex items-center justify-between gap-1 sm:gap-3 pointer-events-none">
      {/* Top-Left: Compact Back & 3D Menu Pill */}
      <Link
        href="/menu"
        className="pointer-events-auto group inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-[rgba(16,12,9,0.7)] backdrop-blur-xl border border-[rgba(240,195,107,0.35)] hover:border-[#F0C36B] hover:shadow-[0_0_18px_rgba(240,195,107,0.35)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all active:scale-95 shrink-0"
        aria-label="Back to 3D Menu"
      >
        <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F0C36B] group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-[11px] sm:text-xs font-semibold tracking-wide text-[#F8F2E8]">
          3D Menu
        </span>
      </Link>

      {/* Top-Center: Integrated 3D Camera Controls Slot */}
      {children}

      {/* Top-Right: Compact Cart Button */}
      <Link
        href="/cart"
        className="pointer-events-auto group inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-[rgba(16,12,9,0.7)] backdrop-blur-xl border border-[rgba(240,195,107,0.35)] hover:border-[#F0C36B] hover:shadow-[0_0_18px_rgba(240,195,107,0.35)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all active:scale-95 shrink-0"
        title="View Cart"
      >
        <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F0C36B] group-hover:scale-110 transition-transform" />
        <span className="text-[11px] sm:text-xs font-semibold text-[#F8F2E8] hidden sm:inline">Cart</span>
        {mounted && totalCartItems > 0 && (
          <span className="min-w-[17px] h-[17px] px-1 rounded-full bg-[#F0C36B] text-[#100C09] text-[9.5px] font-bold flex items-center justify-center leading-none">
            {totalCartItems > 99 ? '99+' : totalCartItems}
          </span>
        )}
      </Link>
    </header>
  );
}
