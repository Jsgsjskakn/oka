'use client';

import { ChevronRight, ShoppingBag, CalendarDays, Heart, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import type { UserProfile } from '@/types/user';

interface ProfileHeaderProps {
  user: UserProfile;
  onLogout: () => void;
}

export function ProfileHeader({ user, onLogout }: ProfileHeaderProps) {
  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'GO';

  return (
    <div className="px-4 pt-8 pb-6 border-b border-white/5">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
          <span className="font-heading text-xl font-bold text-primary">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-lg font-bold text-text-primary truncate">
            {user.name || 'Guest'}
          </h1>
          <p className="text-xs text-text-primary/40 truncate">
            {user.phone ? `+91 ${user.phone}` : 'Complete your profile'}
          </p>
        </div>
        <Link
          href="/profile/edit"
          className="w-9 h-9 rounded-full bg-white/5 border border-border-subtle flex items-center justify-center text-text-primary/50 hover:text-text-primary active:scale-95 transition-all"
        >
          <User className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Link href="/profile/orders" className="flex flex-col items-center gap-1.5 p-3 bg-[#1a1a1a] rounded-xl border border-white/5 active:scale-95 transition-transform">
          <ShoppingBag className="w-5 h-5 text-primary" />
          <span className="text-[10px] text-text-primary/60 font-medium">Orders</span>
        </Link>
        <Link href="/profile/reservations" className="flex flex-col items-center gap-1.5 p-3 bg-[#1a1a1a] rounded-xl border border-white/5 active:scale-95 transition-transform">
          <CalendarDays className="w-5 h-5 text-primary" />
          <span className="text-[10px] text-text-primary/60 font-medium">Reservations</span>
        </Link>
        <Link href="/favorites" className="flex flex-col items-center gap-1.5 p-3 bg-[#1a1a1a] rounded-xl border border-white/5 active:scale-95 transition-transform">
          <Heart className="w-5 h-5 text-primary" />
          <span className="text-[10px] text-text-primary/60 font-medium">Favorites</span>
        </Link>
      </div>

      <button
        onClick={onLogout}
        className="mt-6 w-full flex items-center justify-center gap-2 py-3 text-sm text-red-400/70 hover:text-red-400 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  );
}
