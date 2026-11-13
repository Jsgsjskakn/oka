'use client';

import { usePathname } from 'next/navigation';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { CustomerFooter } from './CustomerFooter';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { CinematicPreloader } from '@/components/preloader/CinematicPreloader';

interface MobileShellProps {
  children: React.ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  const pathname = usePathname();

  // Admin and Staff portals manage their own isolated layout
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/employee')) {
    return (
      <>
        {children}
        <ToastContainer />
      </>
    );
  }

  // 3D / AR viewports manage their own immersive spatial HUD
  const isImmersiveViewer =
    pathname?.startsWith('/3d') || pathname?.startsWith('/ar');

  const isBottomNavHidden = Boolean(
    pathname?.startsWith('/3d') ||
      pathname?.match(/^\/ar\/[^/]+$/) ||
      pathname?.match(/^\/menu\/[^/]+\/[^/]+$/) ||
      pathname?.startsWith('/checkout') ||
      pathname?.startsWith('/order/success') ||
      pathname?.startsWith('/booking/success') ||
      pathname?.match(/^\/profile\/orders\/[^/]+$/)
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0A08] text-[#FAF5EC] antialiased selection:bg-[#E2A84B]/30 selection:text-white overflow-x-hidden">
      {!isImmersiveViewer && <CinematicPreloader />}
      {!isImmersiveViewer && <TopBar />}
      <main
        className={`flex-1 ${
          !isImmersiveViewer && pathname !== '/' ? 'pt-[76px] sm:pt-[84px]' : ''
        } ${
          pathname !== '/' && !isBottomNavHidden
            ? 'pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-0'
            : ''
        }`}
      >
        {children}
      </main>
      {/* Footer rendered only on Home page per user specification */}
      {!isImmersiveViewer && pathname === '/' && <CustomerFooter />}
      <BottomNav />
      <ToastContainer />
    </div>
  );
}
