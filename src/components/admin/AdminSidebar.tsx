'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  UtensilsCrossed,
  CalendarDays,
  ClipboardList,
  Grid3x3,
  Users,
  BarChart3,
  Settings,
  Box,
  Shield,
  Sparkles,
  LogOut,
  ExternalLink,
  Search,
  Radio,
  ChevronRight
} from 'lucide-react';

interface NavGroup {
  label: string;
  items: {
    name: string;
    href: string;
    icon: any;
    badge?: string;
    badgeColor?: string;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Core Operations',
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Menu & Catalog', href: '/admin/menu', icon: UtensilsCrossed },
      { name: 'Bookings', href: '/admin/bookings', icon: CalendarDays },
      { name: 'Live Orders', href: '/admin/orders', icon: ClipboardList, badge: 'Live', badgeColor: 'bg-emerald-500/10 text-success border-success/20' },
      { name: 'Floor Tables', href: '/admin/tables', icon: Grid3x3 },
    ]
  },
  {
    label: 'Intelligence & Team',
    items: [
      { name: 'Employees', href: '/admin/employees', icon: Users },
      { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ]
  },
  {
    label: 'System & Assets',
    items: [
      { name: 'Settings', href: '/admin/settings', icon: Settings },
      { name: 'Asset Requests', href: '/admin/assets', icon: Box },
      { name: 'Audit Log', href: '/admin/audit-logs', icon: Shield },
    ]
  }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return NAV_GROUPS;
    const q = searchQuery.toLowerCase();
    return NAV_GROUPS.map(g => ({
      ...g,
      items: g.items.filter(item => item.name.toLowerCase().includes(q))
    })).filter(g => g.items.length > 0);
  }, [searchQuery]);

  return (
    <aside className="w-[280px] my-3 ml-3 md:my-3.5 md:ml-3.5 rounded-2xl md:rounded-2xl bg-obsidian/40 backdrop-blur-3xl border border-border-subtle/80 flex flex-col h-[calc(100vh-28px)] flex-shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative z-40 overflow-hidden">
      {/* Brand Top Header */}
      <div className="p-5 border-b border-border-subtle/70 flex-shrink-0 relative overflow-hidden group">
        <div className="absolute -inset-2 bg-gradient-to-r from-champagne/15 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-champagne/20 to-platinum/5 border border-border-subtle flex items-center justify-center shadow-[0_0_15px_rgba(201,168,76,0.15)] group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="text-champagne w-4 h-4 drop-shadow-[0_0_8px_rgba(201,168,76,0.5)]" />
            </div>
            <div>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-champagne via-platinum to-amber-200 font-serif font-black text-base uppercase tracking-widest block">
                The Golden Oak
              </span>
              <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-champagne/70 block mt-0.5">
                Admin Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-success text-[10px] font-mono font-semibold" title="System Live">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>POS</span>
          </div>
        </div>

        {/* Quick Nav Search Input */}
        <div className="mt-5 relative">
          <Search className="w-3.5 h-3.5 text-text-secondary/70 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search navigation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-surface/90 border border-border-subtle rounded-xl text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all font-medium shadow-inner"
          />
        </div>
      </div>

      {/* Navigation Group Stream */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
        {filteredGroups.map((group) => (
          <div key={group.label} className="space-y-2">
            <p className="px-3 text-[10px] uppercase tracking-[0.15em] font-black text-text-secondary/70/80">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname?.startsWith(`${item.href}`));
                const Icon = item.icon;

                return (
                  <li key={item.name} className="relative">
                    <Link
                      href={item.href}
                      className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-300 font-serif text-[13px] tracking-wide ${
                        isActive
                          ? 'bg-gradient-to-r from-champagne/20 via-[#c9a84c]/5 to-transparent text-platinum border border-border-subtle shadow-[0_0_25px_rgba(201,168,76,0.15)] font-bold'
                          : 'text-text-secondary font-medium hover:text-zinc-100 hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 transition-all duration-300 ${
                          isActive 
                            ? 'text-champagne drop-shadow-[0_0_8px_rgba(201,168,76,0.6)] scale-110' 
                            : 'opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:text-champagne/80'
                        }`} />
                        <span>{item.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span className={`px-2 py-0.5 text-[9px] uppercase tracking-widest font-extrabold rounded-full border shadow-sm ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        )}
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-champagne shadow-[0_0_6px_#c9a84c]" />
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Customer Portal Link Card */}
        <div className="pt-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between p-3 rounded-2xl bg-surface/60 hover:bg-surface border border-border-subtle/80 hover:border-border-strong text-xs text-text-secondary hover:text-text-primary transition-all group shadow-inner"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-champagne/10 border border-champagne/20 flex items-center justify-center text-champagne">
                <Sparkles className="w-3 h-3" />
              </div>
              <span className="font-semibold text-text-secondary group-hover:text-platinum transition-colors">
                Customer Dining Portal
              </span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-text-secondary/70 group-hover:text-text-primary transition-colors" />
          </Link>
        </div>
      </nav>

      {/* Admin Profile & Logout Footer */}
      <div className="p-3.5 border-t border-border-subtle/80 flex-shrink-0 bg-obsidian/70 backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-border-strong flex items-center justify-center text-xs font-serif font-bold text-champagne shadow-inner">
              AD
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-zinc-200">Super Admin</p>
              <p className="text-[10px] text-text-secondary/70 font-mono">admin@thegoldenoak.in</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="group flex items-center justify-center w-full px-4 py-2 text-xs font-semibold text-text-secondary rounded-xl hover:text-danger hover:bg-rose-500/10 hover:border-rose-500/25 border border-border-subtle/60 transition-all duration-300 shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5 mr-2 text-text-secondary/70 group-hover:text-danger transition-colors" />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
}

