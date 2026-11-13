'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowLeft, Crown, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

interface ViewerHeaderProps {
  dishName: string;
  dishSlug?: string;
  dishCategory?: string;
  children?: React.ReactNode;
}

export function ViewerHeader({ children }: ViewerHeaderProps) {
  const totalCartItems = useCartStore((s) => s.getTotalItems());
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  return (
    <>
      {/* ========================================================================= */}
      {/* DESKTOP HEADER (sm and above): Original "3D Food Lounge" + Cart           */}
      {/* ========================================================================= */}
      <header className="hidden sm:flex fixed top-4 sm:top-6 left-4 sm:left-8 right-4 sm:right-8 z-40 items-center justify-between pointer-events-none">
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

      {/* ========================================================================= */}
      {/* MOBILE HEADER (< sm): Compact "3D Menu" pill + Controls in Top Bar        */}
      {/* ========================================================================= */}
      <header className="flex sm:hidden fixed top-[max(10px,env(safe-area-inset-top))] left-2 right-2 z-40 items-center justify-between gap-1 pointer-events-none">
        {/* Top-Left: Compact Back & 3D Menu Pill */}
        <Link
          href="/menu"
          className="pointer-events-auto group inline-flex items-center gap-1.5 px-3 min-h-[48px] min-w-[48px] rounded-full bg-[rgba(16,12,9,0.75)] backdrop-blur-xl border border-[rgba(240,195,107,0.35)] hover:border-[#F0C36B] hover:shadow-[0_0_18px_rgba(240,195,107,0.35)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all active:scale-95 shrink-0 touch-manipulation"
          aria-label="Back to 3D Menu"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#F0C36B] group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-[11px] font-semibold tracking-wide text-[#F8F2E8] whitespace-nowrap">
            <span className="hidden min-[390px]:inline">3D </span>Menu
          </span>
        </Link>

        {/* Top-Center: Integrated 3D Camera Controls Slot on Mobile */}
        <div className="min-w-0 flex items-center justify-center">{children}</div>

        {/* Top-Right: Compact Cart Button */}
        <Link
          href="/cart"
          className="pointer-events-auto group inline-flex items-center gap-1.5 px-3 min-h-[48px] min-w-[48px] rounded-full bg-[rgba(16,12,9,0.75)] backdrop-blur-xl border border-[rgba(240,195,107,0.35)] hover:border-[#F0C36B] hover:shadow-[0_0_18px_rgba(240,195,107,0.35)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all active:scale-95 shrink-0 touch-manipulation"
          title="View Cart"
          aria-label="View Cart"
        >
          <ShoppingCart className="w-3.5 h-3.5 text-[#F0C36B] group-hover:scale-110 transition-transform" />
          {mounted && totalCartItems > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#F0C36B] text-[#100C09] text-[9.5px] font-bold flex items-center justify-center leading-none">
              {totalCartItems > 99 ? '99+' : totalCartItems}
            </span>
          )}
        </Link>
      </header>
    </>
  );
}
