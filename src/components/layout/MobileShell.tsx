'use client';

import { usePathname } from 'next/navigation';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { CustomerFooter } from './CustomerFooter';
import { ToastContainer } from '@/components/ui/ToastContainer';

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

  // 3D / AR viewports don't need the footer
  const isImmersiveViewer =
    pathname?.startsWith('/3d') || pathname?.startsWith('/ar');

  return (
    <div className="flex flex-col min-h-screen bg-[#060e08] text-[#FBF9F5] antialiased selection:bg-[#d4af37]/30 selection:text-white">
      <TopBar />
      <main className="flex-1 pt-16">
        {children}
      </main>
      {!isImmersiveViewer && <CustomerFooter />}
      <BottomNav />
      <ToastContainer />
    </div>
  );
}
