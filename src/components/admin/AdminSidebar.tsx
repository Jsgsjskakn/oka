'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import Link from 'next/link';
import { GoldenOakLogo } from '@/components/admin/GoldenOakLogo';
import { createClient } from '@/lib/supabase/client';
import {
  Home,
  ShoppingBag,
  BookOpen,
  CalendarDays,
  Users,
  BarChart2,
  Package,
  UserCheck,
  Settings,
  ChevronRight,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag, badge: '12' },
  { name: 'Menu', href: '/admin/menu', icon: BookOpen, hasSubmenu: true },
  { name: 'Reservations', href: '/admin/bookings', icon: CalendarDays },
  { name: 'Customers', href: '/admin/messages', icon: Users },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
  { name: 'Inventory', href: '/admin/menu', icon: Package },
  { name: 'Staff', href: '/admin/employees', icon: UserCheck },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const handleLogout = async () => {
    try {
      const { signoutAction } = await import('@/lib/auth/convex-auth-actions');
      await signoutAction();
    } catch {
      // ignore
    }
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    router.push('/admin/login');
  };

  return (
    <aside className="w-[200px] lg:w-[215px] shrink-0 h-full rounded-[24px] bg-black/35 backdrop-blur-2xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.6)] flex flex-col justify-between p-3.5 select-none overflow-y-auto">
      {/* 1. Top Brand Header */}
      <div className="space-y-4">
        <Link href="/admin/dashboard" className="block pt-1 group">
          <GoldenOakLogo size="md" />
        </Link>

        {/* 2. Navigation Items */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin/dashboard' && pathname?.startsWith(`${item.href}`));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#d4af37]/25 to-[#996515]/20 border border-[#d4af37]/60 text-white font-semibold shadow-[0_0_14px_rgba(212,175,55,0.2)]'
                    : 'text-zinc-400 font-medium hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? 'text-[#eac866]' : 'text-zinc-400'
                    }`}
                  />
                  <span className="text-[11px]">{item.name}</span>
                </div>

                {item.badge && (
                  <span className="bg-white/10 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-white/10 font-mono">
                    {item.badge}
                  </span>
                )}

                {item.hasSubmenu && !isActive && (
                  <ChevronRight className="w-3 h-3 text-zinc-500" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 3. Bottom Tagline Quote & Exit Session */}
      <div className="pt-4 border-t border-white/10 flex flex-col items-center text-center space-y-3">
        <div className="space-y-0.5">
          <p className="font-serif italic text-[11px] tracking-wide text-[#F5DC9A]/90 drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]">
            Good Food
          </p>
          <p className="font-serif italic text-[11px] tracking-wide text-[#F5DC9A]/90 drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]">
            Creates
          </p>
          <p className="font-serif italic text-[11px] tracking-wide text-[#F5DC9A]/90 drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]">
            Great Moments
          </p>
        </div>

        <div className="flex flex-col items-center">
          <GoldenOakLogo size="sm" showSubtitle={false} />
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-rose-400 transition-colors w-full py-1 cursor-pointer"
        >
          <LogOut className="w-3 h-3" />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
}
