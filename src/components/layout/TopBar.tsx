'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Heart,
  ShoppingBag,
  User,
  Menu as MenuIcon,
  X,
  Search,
  Phone,
  Home,
  Box,
} from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';
import { useSpotlightStore } from '@/store/spotlight-store';
import { NotificationCenter } from '@/components/layout/NotificationCenter';

export function GoldenOakTreeLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="goldOakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F0C36B" />
          <stop offset="100%" stopColor="#C48E2E" />
        </linearGradient>
      </defs>
      {/* Detailed Oak Foliage Crown Canopy */}
      <circle cx="32" cy="17" r="7.5" stroke="url(#goldOakGrad)" strokeWidth="1.5" fill="none" opacity="0.95" />
      <circle cx="21" cy="21" r="6" stroke="url(#goldOakGrad)" strokeWidth="1.5" fill="none" opacity="0.9" />
      <circle cx="43" cy="21" r="6" stroke="url(#goldOakGrad)" strokeWidth="1.5" fill="none" opacity="0.9" />
      <circle cx="14" cy="29" r="5.5" stroke="url(#goldOakGrad)" strokeWidth="1.5" fill="none" opacity="0.85" />
      <circle cx="50" cy="29" r="5.5" stroke="url(#goldOakGrad)" strokeWidth="1.5" fill="none" opacity="0.85" />
      <circle cx="24" cy="30" r="6" stroke="url(#goldOakGrad)" strokeWidth="1.5" fill="none" opacity="0.9" />
      <circle cx="40" cy="30" r="6" stroke="url(#goldOakGrad)" strokeWidth="1.5" fill="none" opacity="0.9" />
      <circle cx="32" cy="26" r="6.5" stroke="url(#goldOakGrad)" strokeWidth="1.5" fill="none" opacity="0.95" />
      {/* Branch & Trunk Network */}
      <path
        d="M32 24 V 46 M32 32 L21 24 M32 36 L15 30 M32 32 L43 24 M32 36 L49 30 M30 46 H34"
        stroke="url(#goldOakGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Root Network & Base Foundation */}
      <path
        d="M32 46 C 27 52 18 55 13 57 M32 46 C 37 52 46 55 51 57 M32 46 V 55"
        stroke="url(#goldOakGrad)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.substring(0, 2).toUpperCase();
  }
  return 'PG';
}

export function TopBar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);

  const totalCartItems = useCartStore((s) => s.getTotalItems());
  const totalPrice = useCartStore((s) => s.getTotalPrice());
  const favoriteCount = useFavoritesStore((s) => s.favoriteIds.length);
  const openSpotlight = useSpotlightStore((s) => s.openSpotlight);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setIsMounted(true);
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null));
  }, [pathname]);

  // Primary editorial links matching reference screenshot
  const navLinks = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Menu', href: '/menu' },
    { label: '3D View', href: '/3d/mushroom-truffle-pizza', icon: Box },
    { label: 'Our Story', href: '/about' },
    { label: 'Reservations', href: '/booking', icon: Calendar },
  ];

  return (
    <>
      <header
        className="fixed top-2.5 sm:top-4 left-3 sm:left-6 right-3 sm:right-6 max-w-7xl mx-auto h-[58px] sm:h-[62px] z-50 transition-all select-none rounded-2xl sm:rounded-full border"
        style={{
          background: 'rgba(16, 12, 9, 0.35)',
          backdropFilter: 'blur(28px) saturate(160%)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          border: '1px solid rgba(240, 195, 107, 0.35)',
          borderTop: '1px solid rgba(255, 235, 185, 0.45)',
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.20), 0 16px 45px rgba(0, 0, 0, 0.65)',
        }}
      >
        <div className="max-w-7xl mx-auto h-full px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Zone: Brand Crest & Monogram */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0 shrink">
            {/* Ornate Golden Oak Tree Crest */}
            <GoldenOakTreeLogo className="w-7 h-7 sm:w-9 sm:h-9 text-[#E2A84B] group-hover:scale-105 transition-transform shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-serif text-[16px] min-[380px]:text-[18px] sm:text-[20px] font-bold tracking-tight text-[#FAF5EC] group-hover:text-[#E2A84B] transition-colors leading-none truncate">
                The Golden Oak
              </span>
              <span className="text-[7.5px] min-[380px]:text-[8.5px] tracking-[0.16em] min-[380px]:tracking-[0.25em] uppercase text-[#9A9286] font-medium mt-0.5 leading-none font-mono truncate">
                RESTAURANT &amp; LOUNGE
              </span>
            </div>
          </Link>

          {/* Center Zone: Primary Editorial Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 shrink-0">
            {navLinks.map((link) => {
              const isActive = link.href === '/' ? pathname === '/' : Boolean(pathname?.startsWith(link.href));
              const LinkIcon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative py-1 text-[13px] tracking-[0.04em] transition-colors group flex items-center gap-1.5"
                >
                  {LinkIcon && (
                    <LinkIcon
                      className={`w-3.5 h-3.5 transition-colors ${
                        isActive ? 'text-[#E2A84B]' : 'text-[#B5ADA2] group-hover:text-[#FAF5EC]'
                      }`}
                    />
                  )}
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-[#E2A84B] font-semibold' : 'text-[#B5ADA2] group-hover:text-[#FAF5EC] font-medium'
                    }`}
                  >
                    {link.label}
                  </span>
                  {/* Smooth sliding gold underline for active link */}
                  {isActive ? (
                    <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-[#F6D386] via-[#E2A84B] to-[#D49432] shadow-[0_0_10px_rgba(226,168,75,0.7)]" />
                  ) : (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-[1.5px] rounded-full bg-[#E2A84B]/50 transition-all duration-300 group-hover:w-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Zone: Action Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-3.5 shrink-0">
            {/* Concierge Notification Bell (Exact Location of Red Box) */}
            <NotificationCenter />

            {/* Search Icon */}
            <button
              type="button"
              onClick={() => openSpotlight()}
              title="Search Culinary Archive (⌘K)"
              aria-label="Open culinary search"
              className="group flex items-center justify-center text-[#B5ADA2] hover:text-[#FAF5EC] transition-all min-w-[48px] min-h-[48px] rounded-full hover:bg-white/[0.05] active:scale-95 cursor-pointer shrink-0 touch-manipulation"
            >
              <Search className="w-4 h-4 transition-colors group-hover:text-[#F0C36B]" />
            </button>

            {/* Book Table Button (Rounded Capsule Outline) */}
            <Link
              href="/booking"
              className="hidden sm:inline-flex items-center gap-1.5 h-[36px] min-h-[36px] px-3.5 rounded-full text-[11px] font-semibold tracking-wide text-[#FAF5EC] hover:text-[#FFE3A5] bg-white/[0.04] hover:bg-white/[0.08] border border-[#F0C36B]/50 hover:border-[#F0C36B] shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all shrink-0"
            >
              <Calendar className="w-3 h-3 text-[#F0C36B] shrink-0" />
              <span>Book Table</span>
            </Link>

            {/* Dining Cart Button with Notification Badge */}
            <Link
              href="/cart"
              title="Your Dining Cart"
              aria-label="Your Dining Cart"
              className="relative min-w-[48px] min-h-[48px] rounded-full hover:bg-white/[0.05] text-[#B5ADA2] hover:text-[#FAF5EC] transition-all flex items-center justify-center shrink-0 touch-manipulation"
            >
              <ShoppingBag className="w-4 h-4 transition-transform hover:scale-105" />
              {isMounted && totalCartItems > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-0.5 rounded-full bg-[#E0532B] text-white text-[8.5px] font-mono font-bold flex items-center justify-center shadow-[0_2px_6px_rgba(224,83,43,0.5)]">
                  {totalCartItems > 99 ? '99+' : totalCartItems}
                </span>
              )}
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation drawer"
              aria-expanded={mobileMenuOpen}
              className="lg:hidden text-[#FAF5EC] hover:text-[#F0C36B] transition-colors min-w-[48px] min-h-[48px] rounded-full hover:bg-white/[0.05] flex items-center justify-center shrink-0 cursor-pointer touch-manipulation"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div role="dialog" aria-modal="true" aria-label="Mobile Navigation Drawer" className="lg:hidden fixed inset-0 z-[100] flex">
          <div
            className="fixed inset-0 z-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 ml-auto w-[min(85vw,320px)] h-full max-h-[100dvh] overflow-y-auto overscroll-contain bg-[#0D0A08] border-l border-[#E2A84B]/20 p-5 sm:p-6 flex flex-col justify-between gap-6 shadow-2xl animate-in slide-in-from-right duration-200 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="space-y-6">
              {/* Header inside drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <GoldenOakTreeLogo className="w-6 h-6 text-[#E2A84B]" />
                  <div>
                    <span className="font-serif font-bold text-base text-[#FAF5EC] block">The Golden Oak</span>
                    <span className="text-[8px] tracking-[0.25em] text-[#9A9286] uppercase block font-mono">Restaurant &amp; Lounge</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation drawer"
                  className="min-w-[48px] min-h-[48px] rounded-full bg-white/5 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Account Box */}
              {currentUser ? (
                <div className="p-3.5 rounded-lg bg-white/[0.03] border border-[#E2A84B]/25 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full border border-[#E2A84B]/60 bg-gradient-to-br from-[#1A1410] to-[#0D0A08] text-[#E2A84B] font-mono font-bold text-[11px] flex items-center justify-center shrink-0 shadow-sm">
                      {getInitials(currentUser.name, currentUser.email)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#FAF5EC] truncate">{currentUser.name || 'Valued Guest'}</p>
                      <p className="text-[10px] text-white/50 truncate">{currentUser.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href="/profile/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-1.5 px-2 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-medium text-white/80 text-center flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="w-3 h-3 text-[#E2A84B]" />
                      <span>My Orders</span>
                    </Link>
                    <Link
                      href="/booking"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-1.5 px-2 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-medium text-white/80 text-center flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3 h-3 text-[#E2A84B]" />
                      <span>Bookings</span>
                    </Link>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center text-[10.5px] text-[#E2A84B] hover:underline pt-0.5"
                  >
                    View Account &amp; History →
                  </Link>
                </div>
              ) : (
                <div className="p-3.5 rounded-lg bg-white/[0.03] border border-white/10 space-y-2.5">
                  <div>
                    <p className="text-xs font-semibold text-[#FAF5EC]">Welcome to The Golden Oak</p>
                    <p className="text-[10.5px] text-white/50">Sign in to book tables &amp; track orders</p>
                  </div>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-[6px] bg-[#E2A84B]/15 hover:bg-[#E2A84B]/25 border border-[#E2A84B]/40 text-[#E2A84B] font-semibold text-xs transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Customer Sign In / Register</span>
                  </Link>
                </div>
              )}

              {/* Navigation list (Our Story removed on mobile per user request) */}
              <nav className="space-y-1">
                {navLinks
                  .filter((link) => link.label !== 'Our Story')
                  .map((link) => {
                  const isActive = link.href === '/' ? pathname === '/' : Boolean(pathname?.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-3 min-h-[48px] rounded-md text-xs font-medium transition-colors touch-manipulation ${
                        isActive
                          ? 'bg-[#E2A84B]/10 text-[#E2A84B] border-l-2 border-[#E2A84B]'
                          : 'text-white/75 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <span>{link.label}</span>
                      {(link.href.startsWith('/3d') || link.href === '/ar') && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#E2A84B]/20 text-[#E2A84B] text-[9px] font-bold">
                          3D
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Quick Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openSpotlight();
                  }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 min-h-[48px] rounded-[6px] bg-[#17120E] border border-[#E2A84B]/25 text-xs font-medium text-[#FAF5EC] active:scale-95 transition-all text-left touch-manipulation"
                >
                  <Search className="w-3.5 h-3.5 text-[#E2A84B]" />
                  <span>Search Dishes (Spotlight)</span>
                  <span className="ml-auto text-[10px] font-mono text-[#9A9286] bg-white/[0.06] px-1.5 py-0.5 rounded">⌘K</span>
                </button>

                <Link
                  href="/booking"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 min-h-[44px] text-[#0D0A08] font-bold text-xs shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                    borderRadius: '6px',
                  }}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Reserve a Table</span>
                </Link>

                <Link
                  href="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 min-h-[44px] rounded-[6px] bg-white/[0.05] border border-white/[0.08] text-xs font-medium text-white/90"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#E0532B]" />
                    <span>View Cart</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#E0532B] text-white font-bold text-[10px]">
                    {isMounted ? totalCartItems : 0}
                  </span>
                </Link>
              </div>
            </div>

            {/* Bottom info inside drawer */}
            <div className="pt-4 border-t border-white/[0.08] space-y-2 text-[11px] text-white/50">
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 text-[#E2A84B]" />
                <span>+91 99907 74565</span>
              </div>
              <Link
                href="/employee/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-[#E2A84B] hover:underline pt-1 font-medium"
              >
                Staff Portal Sign In →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
