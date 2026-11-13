'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { Lock, ChevronLeft, ChevronRight, RotateCw, X } from 'lucide-react';

interface AdminShellClientProps {
  adminName: string;
  adminRole?: string;
  children: React.ReactNode;
}

export function AdminShellClient({
  adminName,
  adminRole = 'Admin',
  children,
}: AdminShellClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const mobileNavOpen = openForPath === pathname;

  // Close mobile drawer on Escape
  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenForPath(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileNavOpen]);

  return (
    <div className="w-full max-w-[1420px] min-h-[calc(100dvh-1rem)] lg:h-[95vh] lg:max-h-[930px] rounded-[20px] sm:rounded-[26px] bg-black/25 backdrop-blur-xl border border-white/15 shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_60px_rgba(212,175,55,0.15)] flex flex-col overflow-hidden relative z-10 ring-1 ring-white/10">
      {/* Desktop/Tablet Mac OS Chrome Bar */}
      <div className="hidden sm:flex w-full h-9 items-center justify-between px-4 bg-black/40 border-b border-white/10 shrink-0 select-none backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] inline-block shadow-sm" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] inline-block shadow-sm" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] inline-block shadow-sm" />
          </div>
          <div className="flex items-center gap-1 text-zinc-400 pl-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-0.5 hover:text-white transition-colors cursor-pointer"
              title="Back"
              aria-label="Go back"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => router.forward()}
              className="p-0.5 hover:text-white transition-colors cursor-pointer"
              title="Forward"
              aria-label="Go forward"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-3.5 py-0.5 rounded-lg bg-black/40 border border-white/10 text-xs text-zinc-300 font-mono shadow-inner w-56 md:w-80">
          <div className="flex items-center gap-2 truncate">
            <Lock className="w-3 h-3 text-zinc-400 shrink-0" />
            <span className="text-[11px] font-sans tracking-wide text-zinc-200 truncate">
              {pathname || '/admin'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="p-0.5 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
            title="Refresh view"
            aria-label="Refresh view"
          >
            <RotateCw className="w-2.5 h-2.5" />
          </button>
        </div>

        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 pr-1">
          The Golden Oak Console
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden min-h-0 p-2.5 sm:p-3.5 gap-3 sm:gap-3.5 bg-transparent">
        {/* Desktop Sidebar */}
        <AdminSidebar className="hidden lg:flex w-[205px] xl:w-[220px]" />

        {/* Mobile Drawer Sidebar */}
        {mobileNavOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden flex bg-black/75 backdrop-blur-sm p-3"
            onClick={() => setOpenForPath(null)}
          >
            <div
              className="relative h-full max-w-[85vw] flex"
              onClick={(e) => e.stopPropagation()}
            >
              <AdminSidebar
                className="flex w-[260px] max-w-[82vw]"
                onNavigate={() => setOpenForPath(null)}
              />
              <button
                type="button"
                onClick={() => setOpenForPath(null)}
                aria-label="Close navigation menu"
                className="ml-2 mt-1 w-9 h-9 rounded-full bg-black/70 border border-white/15 flex items-center justify-center text-zinc-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content Column */}
        <div className="flex-1 flex flex-col min-w-0 h-full gap-3 overflow-y-auto pr-0.5">
          <AdminTopBar
            adminName={adminName}
            adminRole={adminRole}
            onOpenMobileNav={() => setOpenForPath(pathname)}
          />

          <div className="flex-1 min-h-0 space-y-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
