'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';

export function TopBar() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-obsidian/80 backdrop-blur-md border-b border-border-subtle z-50 flex items-center justify-between px-4">
      <Link href="/" className="flex flex-col">
        <span className="font-heading text-lg text-primary gold-gradient">The Golden Oak</span>
        <span className="text-[10px] tracking-widest uppercase text-muted-foreground mt-0.5">Premium Dining</span>
      </Link>
      <Link href="/notifications" className="w-10 h-10 flex items-center justify-center rounded-full bg-[#111] hover:bg-[#1a1a1a] transition-colors text-primary relative">
        <Bell className="w-5 h-5" />
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-black"></span>
      </Link>
    </header>
  );
}
