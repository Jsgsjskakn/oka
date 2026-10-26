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
  Sparkles,
  Phone,
} from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';

export function TopBar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);

  const totalCartItems = useCartStore((s) => s.getTotalItems());
  const favoriteCount = useFavoritesStore((s) => s.favoriteIds.length);

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

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Menu', href: '/menu' },
    { label: 'Reservations', href: '/booking' },
    { label: '3D Gallery', href: '/ar' },
    { label: 'Favorites', href: '/favorites' },
    { label: 'About', href: '/about' },
    currentUser
      ? { label: 'My Account', href: '/profile' }
      : { label: 'Customer Login', href: '/auth/login' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#061209]/85 backdrop-blur-xl border-b border-white/[0.08] z-50 transition-all select-none">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-[#d4af37] via-[#c5a059] to-[#8a6828] text-black shadow-md shadow-[#d4af37]/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-4 h-4 text-black" />
            </span>
            <div className="leading-tight">
              <span className="font-heading text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-[#d4af37] transition-colors">
                The Golden Oak
              </span>
              <span className="text-[9.5px] tracking-widest uppercase text-[#d4af37] font-medium block">
                Artisanal Dining
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white/[0.08] text-[#d4af37] border border-[#d4af37]/30 shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & Book CTA */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Search Link */}
            <Link
              href="/menu"
              title="Search Dishes"
              className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-white/75 hover:text-white transition-all"
            >
              <Search className="w-4 h-4" />
            </Link>

            {/* Favorites Icon with Badge */}
            <Link
              href="/favorites"
              title="Saved Favorites"
              className="relative w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-white/75 hover:text-white transition-all"
            >
              <Heart className="w-4 h-4 text-rose-400" />
              {isMounted && favoriteCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-md">
                  {favoriteCount}
                </span>
              )}
            </Link>

            {/* Cart Icon with Live Badge */}
            <Link
              href="/cart"
              title="Your Dining Cart"
              className="relative w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-white/75 hover:text-white transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-[#3EE094]" />
              {isMounted && totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#3EE094] text-[#06180e] text-[9.5px] font-extrabold flex items-center justify-center shadow-md">
                  {totalCartItems > 99 ? '99+' : totalCartItems}
                </span>
              )}
            </Link>

            {/* Desktop Customer Account / Sign In */}
            {currentUser ? (
              <Link
                href="/profile"
                title="Customer Account & History"
                className="hidden sm:inline-flex items-center gap-2 py-1.5 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-[#d4af37]/40 text-white transition-all group"
              >
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8a6828] text-black font-extrabold text-[10px] flex items-center justify-center">
                  {(currentUser.name || currentUser.email || 'U').substring(0, 1).toUpperCase()}
                </span>
                <span className="text-xs font-semibold text-white/90 group-hover:text-[#d4af37] max-w-[85px] truncate">
                  {currentUser.name ? currentUser.name.split(' ')[0] : 'Profile'}
                </span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                title="Customer Sign In"
                className="hidden sm:inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-white/90 hover:text-white text-xs font-semibold transition-all hover:border-[#d4af37]/40"
              >
                <User className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile Account Icon */}
            <Link
              href={currentUser ? '/profile' : '/auth/login'}
              title={currentUser ? 'Customer Account' : 'Customer Sign In'}
              className="sm:hidden w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/75"
            >
              {currentUser ? (
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8a6828] text-black font-extrabold text-[10px] flex items-center justify-center">
                  {(currentUser.name || currentUser.email || 'U').substring(0, 1).toUpperCase()}
                </span>
              ) : (
                <User className="w-4 h-4 text-[#d4af37]" />
              )}
            </Link>

            {/* Desktop Book Table CTA Button */}
            <Link
              href="/booking"
              className="hidden sm:inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#c5a059] to-[#b38936] text-black font-semibold text-xs shadow-md shadow-[#d4af37]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Table</span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation drawer"
              className="lg:hidden w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/80 hover:text-white transition-all"
            >
              <MenuIcon className="w-4 h-4" />
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
          <div className="relative ml-auto w-[280px] sm:w-[320px] h-full bg-[#07130a] border-l border-white/10 p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              {/* Header inside drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#8a6828] flex items-center justify-center text-black">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-black" />
                  </span>
                  <span className="font-heading font-bold text-sm text-white">The Golden Oak</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation drawer"
                  className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/80 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Customer Account Box */}
              {currentUser ? (
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-[#d4af37]/25 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8a6828] text-black font-extrabold text-xs flex items-center justify-center shrink-0">
                      {(currentUser.name || currentUser.email || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{currentUser.name || 'Valued Guest'}</p>
                      <p className="text-[10px] text-white/50 truncate">{currentUser.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <Link
                      href="/profile/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-1.5 px-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[10.5px] font-medium text-white/80 text-center flex items-center justify-center gap-1"
                    >
                      <ShoppingBag className="w-3 h-3 text-[#3EE094]" />
                      <span>My Orders</span>
                    </Link>
                    <Link
                      href="/profile/reservations"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-1.5 px-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[10.5px] font-medium text-white/80 text-center flex items-center justify-center gap-1"
                    >
                      <Calendar className="w-3 h-3 text-[#d4af37]" />
                      <span>Bookings</span>
                    </Link>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center text-[10.5px] text-[#d4af37] hover:underline pt-0.5"
                  >
                    View Full Profile →
                  </Link>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-white">Welcome to The Golden Oak</p>
                    <p className="text-[10.5px] text-white/50">Sign in to book tables & view order history</p>
                  </div>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-[#d4af37]/40 text-[#d4af37] font-semibold text-xs transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Customer Sign In / Register</span>
                  </Link>
                </div>
              )}

              {/* Navigation list */}
              <nav className="space-y-1">
                {navLinks.map((link) => {
                  const isActive =
                    link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30'
                          : 'text-white/75 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <span>{link.label}</span>
                      {link.href === '/ar' && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#3EE094]/15 text-[#3EE094] text-[9px] font-bold">
                          3D
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Quick Action Buttons */}
              <div className="pt-2 space-y-2">
                <Link
                  href="/booking"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38936] text-black font-semibold text-xs shadow-md"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Reserve a Table</span>
                </Link>

                <Link
                  href="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs font-medium text-white/90"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#3EE094]" />
                    <span>View Cart</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#3EE094] text-[#06180e] font-bold text-[10px]">
                    {totalCartItems}
                  </span>
                </Link>
              </div>
            </div>

            {/* Bottom info inside drawer */}
            <div className="pt-4 border-t border-white/[0.08] space-y-2 text-[11px] text-white/50">
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 text-[#d4af37]" />
                <span>+91 99907 74565</span>
              </div>
              <Link
                href="/employee/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-[#d4af37] hover:underline pt-1 font-medium"
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
