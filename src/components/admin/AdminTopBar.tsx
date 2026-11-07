'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Search, Bell, Moon, ChevronDown } from 'lucide-react';

interface AdminTopBarProps {
  adminName?: string;
  adminRole?: string;
}

export function AdminTopBar({
  adminName = 'Sajib',
  adminRole = 'Admin',
}: AdminTopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasNotification, setHasNotification] = useState(true);

  return (
    <header className="w-full h-13 shrink-0 rounded-[20px] bg-black/35 backdrop-blur-2xl border border-white/10 shadow-[0_8px_25px_rgba(0,0,0,0.5)] px-4 py-2 flex items-center justify-between select-none">
      {/* 1. Left: Welcome Greeting & Subtitle */}
      <div className="space-y-0.5">
        <h1 className="text-sm md:text-base font-bold text-white tracking-wide flex items-center gap-2">
          <span>Welcome back, {adminName}</span>
          <span className="text-base inline-block hover:rotate-12 transition-transform cursor-default">
            👋
          </span>
        </h1>
        <p className="text-[10px] md:text-[11px] text-zinc-400 font-medium">
          Here&apos;s what&apos;s happening at The Golden Oak today.
        </p>
      </div>

      {/* 2. Right: Search bar with ⌘K, Bell, Moon, Profile */}
      <div className="flex items-center gap-2.5">
        {/* Search Pill */}
        <div className="relative w-60 md:w-72 lg:w-80">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search anything... (orders, menu, customers)"
            className="w-full bg-black/30 border border-white/10 rounded-full pl-9 pr-11 py-1.5 text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400/40 backdrop-blur-md transition-all shadow-inner"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="text-[9px] text-zinc-400 bg-white/5 border border-white/10 px-1 py-0.5 rounded font-mono">
              ⌘ K
            </span>
          </div>
        </div>

        {/* Circular Notification Bell */}
        <button
          type="button"
          onClick={() => setHasNotification(false)}
          className="relative w-8 h-8 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors shadow-md cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          {hasNotification && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
          )}
        </button>

        {/* Circular Theme Toggle Button (Moon) */}
        <button
          type="button"
          className="w-8 h-8 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors shadow-md cursor-pointer"
          title="Toggle Night Theme"
        >
          <Moon className="w-3.5 h-3.5" />
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 pl-1 pr-2 py-0.5 rounded-full bg-black/30 border border-white/10 shadow-md cursor-pointer hover:border-white/20 transition-colors">
          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/20 shrink-0">
            <Image
              src="/images/admin-avatar.png"
              alt={`${adminName} Profile`}
              fill
              className="object-cover"
              sizes="24px"
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold text-white leading-tight">
              {adminName}
            </span>
            <span className="text-[9px] text-zinc-400 font-medium leading-tight">
              {adminRole}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-zinc-400 ml-0.5" />
        </div>
      </div>
    </header>
  );
}
