'use client';

import Link from 'next/link';
import { UtensilsCrossed, Calendar, Box, Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface QuickAction {
  label: string;
  sublabel: string;
  icon: LucideIcon;
  href: string;
  badge?: string;
  accent?: boolean;
}

export function QuickActions() {
  const actions: QuickAction[] = [
    {
      label: 'Culinary Menu',
      sublabel: 'Dishes & Specials',
      icon: UtensilsCrossed,
      href: '/menu',
      accent: true,
    },
    {
      label: 'Book Table',
      sublabel: 'Instant Allocation',
      icon: Calendar,
      href: '/booking',
      badge: 'Live',
      accent: true,
    },
    {
      label: '3D & AR Food',
      sublabel: 'Interactive Models',
      icon: Box,
      href: '/ar',
      badge: '3D',
    },
    {
      label: 'My Favorites',
      sublabel: 'Saved Dishes',
      icon: Heart,
      href: '/favorites',
    },
  ];

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-4 relative z-30 max-w-7xl mx-auto w-full -mt-4 sm:-mt-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`group p-4 sm:p-5 rounded-2xl transition-all duration-300 relative overflow-hidden flex items-center gap-3.5 border ${
              action.accent
                ? 'bg-gradient-to-br from-[#0c1f13]/90 via-[#07140b]/80 to-[#050e08]/90 border-[#d4af37]/25 hover:border-[#d4af37]/60 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:-translate-y-0.5'
                : 'bg-[#09150d]/80 border-white/[0.08] hover:border-white/20 shadow-md hover:-translate-y-0.5'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                action.accent
                  ? 'bg-gradient-to-br from-[#d4af37]/25 to-[#c5a059]/10 text-[#d4af37] border border-[#d4af37]/30 shadow-inner'
                  : 'bg-white/[0.05] text-white/80 border border-white/10'
              }`}
            >
              <action.icon className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-heading text-xs sm:text-sm font-bold text-white tracking-tight truncate group-hover:text-[#d4af37] transition-colors">
                  {action.label}
                </span>
                {action.badge && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/30 text-[9px] font-bold text-[#d4af37]">
                    {action.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-white/50 block truncate mt-0.5">
                {action.sublabel}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
