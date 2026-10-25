import { getCurrentUser } from '@/lib/auth/convex-auth-actions';
import { createClient } from '@/lib/supabase/server';
import { MockLoginCard } from '@/components/profile/MockLoginCard';
import { ShoppingBag, CalendarDays, Heart, ChevronRight, User, Phone } from 'lucide-react';
import Link from 'next/link';

export default async function ProfilePage() {
  // 1. Primary: Resolve Convex session
  const convexUser = await getCurrentUser();
  if (convexUser) {
    return (
      <AuthenticatedProfileView
        user={{ id: convexUser.userId, email: convexUser.email }}
        profile={{ name: convexUser.name, phone: convexUser.phone }}
      />
    );
  }

  // 2. Secondary: Fallback to Supabase session (data fetched inside try/catch, JSX returned outside)
  let supabaseUser: any = null;
  let supabaseProfile: any = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      supabaseUser = data.user;
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      supabaseProfile = profile;
    }
  } catch {
    // Supabase unavailable
  }

  if (supabaseUser) {
    return <AuthenticatedProfileView user={supabaseUser} profile={supabaseProfile} />;
  }

  return <GuestProfileView />;
}

function GuestProfileView() {
  return (
    <div className="min-h-screen bg-obsidian text-text-primary pb-24">
      <div className="px-4 py-6 text-center border-b border-white/5">
        <h1 className="font-heading text-xl font-bold text-text-primary">My Profile</h1>
        <p className="text-xs text-text-primary/40 mt-1">Sign in to manage your account</p>
      </div>
      <MockLoginCard />
    </div>
  );
}

function AuthenticatedProfileView({ user, profile }: { user: any; profile: any }) {
  const menuItems = [
    { label: 'My Orders', href: '/profile/orders', icon: ShoppingBag, desc: 'View and reorder past meals' },
    { label: 'My Reservations', href: '/profile/reservations', icon: CalendarDays, desc: 'View booking history' },
    { label: 'Favorites', href: '/favorites', icon: Heart, desc: 'Your saved dishes' },
    { label: 'Contact Us', href: '/contact', icon: Phone, desc: 'Get in touch with support' },
  ];

  const initials = (profile?.name || user.email || 'GO')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-obsidian text-text-primary pb-24">
      <div className="px-4 pt-8 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="font-heading text-xl font-bold text-primary">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-lg font-bold text-text-primary truncate">
              {profile?.name || user.email}
            </h1>
            <p className="text-xs text-text-primary/40 truncate">
              {user.email}
            </p>
          </div>
          <Link
            href="/profile/edit"
            className="w-9 h-9 rounded-full bg-white/5 border border-border-subtle flex items-center justify-center text-text-primary/50 hover:text-text-primary active:scale-95 transition-all"
          >
            <User className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="px-4 py-6">
        <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-4">Quick Access</h3>
        <div className="flex flex-col gap-3">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 bg-[#1a1a1a] border border-white/5 rounded-xl p-4 active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{item.label}</p>
                <p className="text-[10px] text-text-primary/40">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-primary/30 shrink-0" />
            </Link>
          ))}
        </div>
        
        <form action="/api/auth/signout" method="POST" className="mt-8">
          <button type="submit" className="w-full flex items-center justify-center gap-2 py-4 bg-[#1a1a1a] rounded-xl border border-white/5 text-sm text-red-400 hover:text-red-300 hover:bg-[#202020] active:scale-[0.98] transition-all">
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
