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

export function TopBar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);

  const totalCartItems = useCartStore((s) => s.getTotalItems());
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

  // Primary 4 editorial links only (Home, Favorites, My Account moved out of center bar)
  const navLinks = [
    { label: 'Menu', href: '/menu' },
    { label: '3D Food Lounge', href: '/ar' },
    { label: 'Our Story', href: '/about' },
    { label: 'Reservations', href: '/booking' },
  ];

  return (
    <>
      <header
        className="sticky top-0 left-0 right-0 h-[80px] z-50 transition-all select-none border-b"
        style={{
          background: 'rgba(13, 10, 8, 0.78)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottomColor: 'rgba(226, 168, 75, 0.14)',
        }}
      >
        <div className="max-w-7xl mx-auto h-full px-6 md:px-12 flex items-center justify-between gap-6">
          {/* Left Zone: Brand Crest */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            {/* Minimal Gold Monogram Crest (no yellow background box) */}
            <UtensilsCrossed className="w-5 h-5 text-[#E2A84B] group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="font-serif text-[22px] font-bold tracking-tight text-[#FAF5EC] group-hover:text-[#E2A84B] transition-colors leading-none">
                The Golden Oak
              </span>
              <span className="text-[9px] tracking-[0.28em] uppercase text-[#9A9286] font-medium mt-1 leading-none">
                ARTISANAL DINING
              </span>
            </div>
          </Link>

          {/* Center Zone: 4 Primary Editorial Nav Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative py-2 text-sm font-medium transition-colors group flex flex-col items-center"
                >
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-[#FAF5EC] font-semibold' : 'text-[#FAF5EC]/75 group-hover:text-[#FAF5EC]'
                    }`}
                  >
                    {link.label}
                  </span>
                  {/* Subtle 2px gold dot or sliding underline for active link (no box) */}
                  {isActive ? (
                    <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#E2A84B]" />
                  ) : (
                    <span className="absolute -bottom-1 w-0 h-[2px] bg-[#E2A84B]/60 transition-all duration-300 group-hover:w-full rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Zone: Action Cluster */}
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Search Icon with Spotlight Modal Trigger & ⌘K Badge */}
            <button
              type="button"
              onClick={() => openSpotlight()}
              title="Search Culinary Archive (⌘K)"
              className="group flex items-center gap-1.5 text-[#FAF5EC] hover:text-[#E2A84B] transition-all p-1 active:scale-85 cursor-pointer"
            >
              <Search className="w-4 h-4 transition-colors group-hover:text-[#E2A84B]" />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[#9A9286] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline leading-none">
                ⌘K
              </span>
            </button>

            {/* Favorites Heart Icon with Active Molten Gold State & 4px Glow Dot */}
            <Link
              href="/favorites"
              title="Saved Favorites"
              className={`relative p-1 transition-all flex flex-col items-center ${
                pathname === '/favorites'
                  ? 'text-[#E2A84B]'
                  : 'text-[#FAF5EC] hover:text-[#E2A84B]'
              }`}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  pathname === '/favorites' ? 'fill-[#E2A84B]/20 stroke-[#E2A84B]' : ''
                }`}
              />
              {isMounted && favoriteCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#E0532B] text-white text-[8.5px] font-bold flex items-center justify-center shadow-sm">
                  {favoriteCount}
                </span>
              )}
              {pathname === '/favorites' && (
                <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-[#E2A84B] shadow-[0_0_8px_#E2A84B]" />
              )}
            </Link>

            {/* Cart Bag Icon with Spiced Saffron Badge (Clean, no circular border box) */}
            <Link
              href="/cart"
              title="Your Cart"
              className="relative text-[#FAF5EC] hover:text-[#E2A84B] transition-colors p-1"
            >
              <ShoppingBag className="w-4 h-4" />
              {isMounted && totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#E0532B] text-white text-[9px] font-bold flex items-center justify-center shadow-md">
                  {totalCartItems > 99 ? '99+' : totalCartItems}
                </span>
              )}
            </Link>

            {/* User Profile Pill -> Clean 32px Avatar Circle */}
            {currentUser ? (
              <Link
                href="/profile"
                title={`${currentUser.name || 'User'} - Account`}
                className="w-8 h-8 rounded-full border border-[#E2A84B]/40 bg-gradient-to-br from-[#E2A84B]/20 to-[#9E6818]/30 flex items-center justify-center text-xs font-bold text-[#FAF5EC] hover:border-[#E2A84B] hover:scale-105 transition-all shadow-sm"
              >
                {(currentUser.name || currentUser.email || 'U').substring(0, 1).toUpperCase()}
              </Link>
            ) : (
              <Link
                href="/auth/login"
                title="Customer Sign In"
                className="w-8 h-8 rounded-full border border-white/20 bg-white/[0.04] flex items-center justify-center text-[#FAF5EC] hover:text-[#E2A84B] hover:border-[#E2A84B]/50 transition-all"
              >
                <User className="w-4 h-4" />
              </Link>
            )}

            {/* Book Table CTA: Molten Gold Gradient with Sharp 6px Luxury Edge */}
            <Link
              href="/booking"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-[#0D0A08] transition-all duration-300 hover:brightness-110 active:scale-[0.98] shadow-md"
              style={{
                background: 'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                borderRadius: '6px',
              }}
            >
              <span>Book Table</span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation drawer"
              className="lg:hidden text-[#FAF5EC] hover:text-[#E2A84B] transition-colors p-1"
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
                    <div className="w-8 h-8 rounded-full border border-[#E2A84B]/40 bg-gradient-to-br from-[#E2A84B]/20 to-[#9E6818]/30 text-[#FAF5EC] font-bold text-xs flex items-center justify-center shrink-0">
                      {(currentUser.name || currentUser.email || 'U').substring(0, 1).toUpperCase()}
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
