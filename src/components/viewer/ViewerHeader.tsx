'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Box, Eye } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';

interface ViewerHeaderProps {
  dishName: string;
  dishSlug?: string;
  dishCategory?: string;
}

export function ViewerHeader({ dishName, dishSlug }: ViewerHeaderProps) {
  const router = useRouter();
  const totalCartItems = useCartStore((s) => s.getTotalItems());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="fixed top-5 sm:top-6 left-4 sm:left-8 right-4 sm:right-8 z-40 flex items-center justify-between pointer-events-none">
      {/* Top-Left: Back & Breadcrumb Pill */}
      <Link
        href="/ar"
        className="pointer-events-auto group inline-flex items-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-lg bg-[rgba(21,17,14,0.75)] backdrop-blur-md border border-[rgba(226,168,75,0.25)] hover:border-[#E2A84B] hover:shadow-[0_0_15px_rgba(226,168,75,0.25)] transition-all active:scale-95"
        aria-label="Back to 3D Food Lounge"
      >
        <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1 text-[#E2A84B] font-bold text-sm">
          ←
        </span>
        <span className="text-xs sm:text-sm font-medium tracking-wide text-[#FAF5EC]">
          3D Food Lounge
        </span>
      </Link>

      {/* Top-Center: Segmented Interactive Mode Switcher */}
      <div className="pointer-events-auto hidden md:inline-flex items-center p-1 rounded-xl bg-[rgba(21,17,14,0.85)] backdrop-blur-md border border-[rgba(226,168,75,0.2)] shadow-lg">
        {/* Active: 360° Studio View */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#0E1F18] border border-[#22C58B]/30 text-[#E2A84B] text-xs font-semibold shadow-[0_0_12px_rgba(34,197,139,0.15)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C58B] shadow-[0_0_6px_#22C58B] animate-pulse" />
          <span>360° Studio View</span>
        </div>

        {/* Inactive: Place on My Table (AR) */}
        <Link
          href={dishSlug ? `/ar` : `/ar`}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#9A9286] hover:text-[#FAF5EC] hover:bg-white/[0.04] transition-all"
        >
          <Box className="w-3.5 h-3.5 text-[#9A9286]" />
          <span>Place on My Table (AR)</span>
        </Link>
      </div>

      {/* Top-Right: Live Cart Drawer / Checkout Pill */}
      <Link
        href="/cart"
        className="pointer-events-auto group inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg bg-[rgba(21,17,14,0.75)] backdrop-blur-md border border-[rgba(226,168,75,0.25)] hover:border-[#E2A84B] hover:shadow-[0_0_15px_rgba(226,168,75,0.2)] transition-all active:scale-95"
        title="View Cart"
      >
        <ShoppingBag className="w-4 h-4 text-[#E2A84B] group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline text-xs font-medium text-[#FAF5EC]">Cart</span>
        {mounted && totalCartItems > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#E0532B] text-[10px] font-bold text-white flex items-center justify-center leading-none shadow-[0_0_8px_rgba(224,83,43,0.5)]">
            {totalCartItems > 99 ? '99+' : totalCartItems}
          </span>
        )}
      </Link>
    </header>
  );
}
