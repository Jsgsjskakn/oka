'use client';
import { useState, useEffect } from 'react';

import { Home, UtensilsCrossed, ShoppingBag, User, Box } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/cart-store';

export function BottomNav() {
  const pathname = usePathname();
  const totalItems = useCartStore((state) => state.getTotalItems());

  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Hide bottom nav on dish detail, checkout, and order success pages
  const isDishDetailPage = pathname.match(/^\/menu\/[^\/]+\/[^\/]+$/);
  const isCheckoutPage = pathname.startsWith('/checkout');
  const isOrderSuccessPage = pathname.startsWith('/order/success');
  const isBookingSuccessPage = pathname.startsWith('/booking/success');
  const isOrderDetailPage = pathname.match(/^\/profile\/orders\/[^\/]+$/);
  const is3DViewerPage = pathname.startsWith('/3d');
  const isARViewerPage = pathname.match(/^\/ar\/[^\/]+$/);
  
  if (isDishDetailPage || isCheckoutPage || isOrderSuccessPage || isBookingSuccessPage || isOrderDetailPage || is3DViewerPage || isARViewerPage) {
    return null;
  }

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Menu', href: '/menu', icon: UtensilsCrossed },
  ];

  const rightItems = [
    { label: 'Cart', href: '/cart', icon: ShoppingBag },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-obsidian/90 backdrop-blur-lg border-t border-white/5 z-50 pb-safe">
      <div className="flex items-center justify-around h-[72px] px-2 relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-text-primary'}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
              {isActive && <div className="absolute bottom-2 w-1 h-1 rounded-full bg-primary" />}
            </Link>
          );
        })}

        {/* Center 3D Button */}
        <div className="relative -top-5 flex flex-col items-center justify-center w-20">
          <Link href="/ar" className="w-14 h-14 rounded-full bg-gradient-to-tr from-champagne to-[#e8c547] flex items-center justify-center text-black shadow-[0_0_15px_rgba(201,168,76,0.4)] transition-transform hover:scale-105 active:scale-95">
            <Box className="w-6 h-6" />
          </Link>
          <span className="text-[10px] text-primary mt-1 font-medium">View 3D</span>
        </div>

        {rightItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors relative ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-text-primary'}`}>
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.label === 'Cart' && isMounted && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-text-primary text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </div>
              <span className="text-[10px]">{item.label}</span>
              {isActive && <div className="absolute bottom-2 w-1 h-1 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
