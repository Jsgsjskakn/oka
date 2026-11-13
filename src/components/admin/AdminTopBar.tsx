'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, ChevronDown, Menu, LogOut, Settings } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface AdminTopBarProps {
  adminName?: string;
  adminRole?: string;
  onOpenMobileNav?: () => void;
}

export function AdminTopBar({
  adminName = 'Admin',
  adminRole = 'Admin',
  onOpenMobileNav,
}: AdminTopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasNotification, setHasNotification] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut Cmd/Ctrl + K focuses search bar
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    router.push(`/admin/orders?search=${encodeURIComponent(trimmed)}`);
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    try {
      const { signoutAction } = await import('@/lib/auth/convex-auth-actions');
      await signoutAction();
    } catch {
      // ignore
    }
    if (isSupabaseConfigured()) {
      try {
        await createClient().auth.signOut();
      } catch {
        // ignore
      }
    }
    router.push('/admin/login');
  };

  return (
    <header className="w-full min-h-13 shrink-0 rounded-[20px] bg-black/35 backdrop-blur-2xl border border-white/10 shadow-[0_8px_25px_rgba(0,0,0,0.5)] px-3 sm:px-4 py-2 flex items-center justify-between gap-2 select-none relative z-20">
      {/* 1. Left: Mobile Drawer Trigger + Welcome Greeting */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
            className="lg:hidden w-9 h-9 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-zinc-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="space-y-0.5 min-w-0">
          <h1 className="text-xs sm:text-sm md:text-base font-bold text-white tracking-wide flex items-center gap-1.5 truncate">
            <span className="truncate">Welcome back, {adminName}</span>
          </h1>
          <p className="hidden sm:block text-[10px] md:text-[11px] text-zinc-400 font-medium truncate">
            Here&apos;s what&apos;s happening at The Golden Oak today.
          </p>
        </div>
      </div>

      {/* 2. Right: Desktop Search bar, Quick Orders Bell, Profile Menu */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Desktop Search Pill */}
        <form onSubmit={handleSearchSubmit} className="hidden md:block relative w-56 lg:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders (name, phone, ID)..."
            className="w-full bg-black/30 border border-white/10 rounded-full pl-9 pr-12 py-1.5 text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400/40 backdrop-blur-md transition-all shadow-inner"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="text-[9px] text-zinc-400 bg-white/5 border border-white/10 px-1 py-0.5 rounded font-mono">
              ⌘ K
            </span>
          </div>
        </form>

        {/* Live Orders Shortcut */}
        <Link
          href="/admin/orders"
          onClick={() => setHasNotification(false)}
          className="relative w-8 h-8 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors shadow-md"
          title="View Live Orders"
          aria-label="View Live Orders"
        >
          <Bell className="w-3.5 h-3.5" />
          {hasNotification && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
          )}
        </Link>

        {/* User Profile Pill + Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            className="flex items-center gap-2 pl-1 pr-2 py-0.5 rounded-full bg-black/30 border border-white/10 shadow-md cursor-pointer hover:border-white/20 transition-colors"
          >
            <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/20 shrink-0">
              <Image
                src="/images/admin-avatar.png"
                alt={`${adminName} Profile`}
                fill
                className="object-cover"
                sizes="24px"
              />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[11px] font-bold text-white leading-tight max-w-[100px] truncate">
                {adminName}
              </span>
              <span className="text-[9px] text-zinc-400 font-medium leading-tight">
                {adminRole}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-zinc-400 ml-0.5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl bg-[#111015] border border-white/15 shadow-2xl py-1.5 z-50">
              <div className="px-3 py-1.5 border-b border-white/10 sm:hidden">
                <p className="text-xs font-semibold text-white truncate">{adminName}</p>
                <p className="text-[10px] text-zinc-400">{adminRole}</p>
              </div>
              <Link
                href="/admin/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-zinc-400" />
                <span>Restaurant Settings</span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
