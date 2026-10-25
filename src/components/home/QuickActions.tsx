'use client';

import Link from 'next/link';
import { UtensilsCrossed, Calendar, Box, Phone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface QuickAction {
  label: string;
  icon: LucideIcon;
  href: string;
  accent?: boolean;
}

export function QuickActions() {
  const actions: QuickAction[] = [
    { label: 'View Menu', icon: UtensilsCrossed, href: '/menu', accent: true },
    { label: 'Book Table', icon: Calendar, href: '/booking', accent: true },
    { label: 'View in AR', icon: Box, href: '/ar' },
    { label: 'Contact Us', icon: Phone, href: '/more' },
  ];

  return (
    <section className="px-4 py-6 -mt-8 relative z-30">
      <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group flex flex-col items-center gap-2 active:scale-95 transition-transform"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              action.accent
                ? 'bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 group-active:from-primary/30 group-active:to-primary/10'
                : 'bg-[#141414] border border-white/8 group-active:bg-[#1a1a1a]'
            }`}>
              <action.icon className={`w-5 h-5 transition-colors ${
                action.accent ? 'text-primary' : 'text-text-primary/60 group-hover:text-text-primary/80'
              }`} />
            </div>
            <span className={`text-[10px] font-medium leading-tight text-center ${
              action.accent ? 'text-text-primary/90' : 'text-text-primary/50'
            }`}>
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
