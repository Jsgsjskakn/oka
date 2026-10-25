'use client';

import { usePathname } from 'next/navigation';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

interface MobileShellProps {
  children: React.ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/employee')) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <main className="flex-1 pb-24 pt-16">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
