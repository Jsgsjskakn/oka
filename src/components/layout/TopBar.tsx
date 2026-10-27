'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UtensilsCrossed,
  Calendar,
  Heart,
  ShoppingBag,
  User,
  Menu as MenuIcon,
  X,
  Search,
  Phone,
} from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';
import { useSpotlightStore } from '@/store/spotlight-store';

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
    { label: 'Home', href: '/' },
    { label: 'Menu', href: '/menu' },
    { label: '3D Food Lounge', href: '/3d/mushroom-truffle-pizza' },
    { label: 'Our Story', href: '/about' },
    { label: 'Reservations', href: '/booking' },
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
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left Zone: Brand Crest & Monogram */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            {/* Minimal Gold Monogram Crest (no yellow background box) */}
            <UtensilsCrossed className="w-4.5 h-4.5 text-[#E2A84B] group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="font-serif text-[19px] sm:text-[20px] font-bold tracking-tight text-[#FAF5EC] group-hover:text-[#E2A84B] transition-colors leading-none">
                The Golden Oak
              </span>
              <span className="text-[8.5px] tracking-[0.28em] uppercase text-[#9A9286] font-medium mt-0.5 leading-none font-mono">
                ARTISANAL DINING
              </span>
            </div>
          </Link>

          {/* Center Zone: 4 Primary Editorial Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => {
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative py-1 text-[13px] tracking-[0.06em] transition-colors group flex flex-col items-center"
                >
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-[#E2A84B] font-semibold' : 'text-[#B5ADA2] group-hover:text-[#FAF5EC] font-medium'
                    }`}
                  >
                    {link.label}
                  </span>
                  {/* Smooth 2px sliding gold underline for active link (NO circular dot) */}
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
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Search Icon with Spotlight Modal Trigger & ⌘K Badge */}
            <button
              type="button"
              onClick={() => openSpotlight()}
              title="Search Culinary Archive (⌘K)"
              className="group flex items-center gap-1.5 text-[#B5ADA2] hover:text-[#FAF5EC] transition-all p-1 active:scale-95 cursor-pointer shrink-0"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors group-hover:text-[#F0C36B]" />
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-[4px] bg-white/[0.06] border border-white/10 text-[#9A9286] group-hover:border-[#F0C36B]/40 group-hover:text-[#F0C36B] opacity-0 group-hover:opacity-100 transition-all hidden sm:inline leading-none">
                ⌘K
              </span>
            </button>

            {/* Favorites Heart Icon with Active Molten Gold State */}
            <Link
              href="/favorites"
              title="Personal Tasting Vault"
              className={`relative p-1 transition-all flex flex-col items-center group shrink-0 ${
                pathname === '/favorites'
                  ? 'text-[#F0C36B]'
                  : 'text-[#B5ADA2] hover:text-[#FAF5EC]'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:scale-110 ${
                  pathname === '/favorites' ? 'fill-[#F0C36B]/25 stroke-[#F0C36B]' : ''
                }`}
              />
              {isMounted && favoriteCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#E0532B] text-white text-[8px] font-bold flex items-center justify-center shadow-[0_2px_6px_rgba(224,83,43,0.4)]">
                  {favoriteCount}
                </span>
              )}
              {pathname === '/favorites' && (
                <span className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full bg-[#F0C36B] shadow-[0_0_8px_#F0C36B]" />
              )}
            </Link>

            {/* 1. Book Table CTA (Translucent Gold Glass Button) */}
            <Link
              href="/booking"
              className="hidden sm:inline-flex relative items-center justify-center gap-1.5 h-[34px] px-3.5 lg:px-4 rounded-[6px] text-[10.5px] font-bold tracking-[0.1em] uppercase text-[#FFE1A0] transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_4px_14px_rgba(240,195,107,0.22)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_0_20px_rgba(240,195,107,0.4)] hover:scale-[1.02] active:scale-[0.98] overflow-hidden group/cta shrink-0 bg-[rgba(240,195,107,0.18)] hover:bg-[rgba(240,195,107,0.28)] border border-[#F0C36B]/60 hover:border-[#F0C36B] backdrop-blur-xl"
            >
              <Calendar className="w-3 h-3 text-[#F0C36B] shrink-0" />
              <span className="relative z-10">BOOK TABLE</span>
              <span className="absolute inset-0 -translate-x-full group-hover/cta:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform ease-out pointer-events-none" />
            </Link>

            {/* 2. Dining Cart Button (Translucent Glass Pill) */}
            <Link
              href="/cart"
              title="Your Dining Cart"
              className="relative h-[34px] px-2.5 sm:px-3 rounded-[6px] flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-[#F0C36B]/35 hover:border-[#F0C36B]/70 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_4px_14px_rgba(0,0,0,0.25)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_16px_rgba(240,195,107,0.25)] active:scale-95 group/cart shrink-0 backdrop-blur-xl"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#F0C36B] transition-transform group-hover/cart:scale-110" />
              <span className="text-[10.5px] font-bold tracking-[0.08em] uppercase text-[#FAF5EC] group-hover/cart:text-[#F0C36B] transition-colors">
                CART
              </span>
              {isMounted && totalCartItems > 0 ? (
                <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-[#E0532B] text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-[0_2px_6px_rgba(224,83,43,0.5)]">
                  {totalCartItems > 99 ? '99+' : totalCartItems}
                </span>
              ) : (
                <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-white/10 text-[#D1C3B1] text-[8.5px] font-mono font-bold flex items-center justify-center">
                  0
                </span>
              )}
            </Link>

            {/* 3. User Profile Avatar ("PG" glass pill on far right) */}
            {currentUser ? (
              <Link
                href="/profile"
                title={`${currentUser.name || 'Member'} - Concierge Dossier`}
                className="w-[32px] h-[32px] rounded-full border border-[#F0C36B]/60 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-xl flex items-center justify-center text-[10.5px] font-mono font-bold tracking-tight text-[#F0C36B] hover:border-[#F0C36B] hover:shadow-[0_0_16px_rgba(240,195,107,0.4)] hover:scale-105 active:scale-95 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shrink-0"
              >
                {getInitials(currentUser.name, currentUser.email)}
              </Link>
            ) : (
              <Link
                href="/auth/login"
                title="Member Sign In"
                className="w-[32px] h-[32px] rounded-full border border-[#F0C36B]/60 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-xl flex items-center justify-center text-[10.5px] font-mono font-bold tracking-tight text-[#F0C36B] hover:border-[#F0C36B] hover:shadow-[0_0_16px_rgba(240,195,107,0.4)] hover:scale-105 active:scale-95 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shrink-0"
              >
                PG
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation drawer"
              className="lg:hidden text-[#FAF5EC] hover:text-[#F0C36B] transition-colors p-1 shrink-0"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative ml-auto w-[280px] sm:w-[320px] h-full bg-[#0D0A08] border-l border-[#E2A84B]/20 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              {/* Header inside drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <UtensilsCrossed className="w-4 h-4 text-[#E2A84B]" />
                  <div>
                    <span className="font-serif font-bold text-base text-[#FAF5EC] block">The Golden Oak</span>
                    <span className="text-[8px] tracking-[0.25em] text-[#9A9286] uppercase block">Artisanal Dining</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation drawer"
                  className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center text-white/80 hover:text-white"
                >
                  <X className="w-4 h-4" />
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

              {/* Navigation list */}
              <nav className="space-y-1">
                {navLinks.map((link) => {
                  const isActive = pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[#E2A84B]/10 text-[#E2A84B] border-l-2 border-[#E2A84B]'
                          : 'text-white/75 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <span>{link.label}</span>
                      {link.href === '/ar' && (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#E2A84B]/20 text-[#E2A84B] text-[9px] font-bold">
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
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-[6px] bg-[#17120E] border border-[#E2A84B]/25 text-xs font-medium text-[#FAF5EC] active:scale-95 transition-all text-left"
                >
                  <Search className="w-3.5 h-3.5 text-[#E2A84B]" />
                  <span>Search Dishes (Spotlight)</span>
                  <span className="ml-auto text-[10px] font-mono text-[#9A9286] bg-white/[0.06] px-1.5 py-0.5 rounded">⌘K</span>
                </button>

                <Link
                  href="/booking"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-[#0D0A08] font-bold text-xs shadow-md"
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
                  className="flex items-center justify-between px-4 py-2.5 rounded-[6px] bg-white/[0.05] border border-white/[0.08] text-xs font-medium text-white/90"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#E0532B]" />
                    <span>View Cart</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#E0532B] text-white font-bold text-[10px]">
                    {totalCartItems}
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
