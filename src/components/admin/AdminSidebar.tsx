'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { GoldenOakLogo } from '@/components/admin/GoldenOakLogo';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
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
  Armchair,
  Images,
  ScrollText,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Menu', href: '/admin/menu', icon: BookOpen, hasSubmenu: true },
  { name: 'Inventory', href: '/admin/menu#inventory', icon: Package },
  { name: 'Reservations', href: '/admin/bookings', icon: CalendarDays },
  { name: 'Tables', href: '/admin/tables', icon: Armchair },
  { name: 'Customers', href: '/admin/messages', icon: Users },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
  { name: 'Media Assets', href: '/admin/assets', icon: Images },
  { name: 'Staff', href: '/admin/employees', icon: UserCheck },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

interface AdminSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function AdminSidebar({ className = '', onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeHash, setActiveHash] = useState('');
  const supabase = useMemo(() => (isSupabaseConfigured() ? createClient() : null), []);

  useEffect(() => {
    const syncHash = () => {
      if (typeof window !== 'undefined') {
        setActiveHash(window.location.hash || '');
      }
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const { signoutAction } = await import('@/lib/auth/convex-auth-actions');
      await signoutAction();
    } catch {
      // ignore
    }
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    onNavigate?.();
    router.push('/admin/login');
  };

  return (
    <aside
      className={`shrink-0 h-full rounded-[24px] bg-black/35 backdrop-blur-2xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.6)] flex flex-col justify-between p-3.5 select-none overflow-y-auto ${className}`}
    >
      {/* 1. Top Brand Header */}
      <div className="space-y-4">
        <Link href="/admin/dashboard" onClick={onNavigate} className="block pt-1 group">
          <GoldenOakLogo size="md" />
        </Link>

        {/* 2. Navigation Items */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const [basePath, itemHash] = item.href.split('#');
            const isInventory = itemHash === 'inventory';
            const isActive = isInventory
              ? pathname === '/admin/menu' && activeHash === '#inventory'
              : item.href === '/admin/menu'
              ? (pathname === '/admin/menu' && activeHash !== '#inventory') ||
                Boolean(pathname?.startsWith('/admin/menu/'))
              : pathname === basePath ||
                (basePath !== '/admin/dashboard' && Boolean(pathname?.startsWith(basePath)));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  setActiveHash(itemHash ? `#${itemHash}` : '');
                  onNavigate?.();
                }}
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
