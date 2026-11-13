import { Bell, User, Settings, ChevronRight, Heart, Calendar, ShieldCheck, FileText, Box } from 'lucide-react';
import Link from 'next/link';
import { CompactFooter } from '@/components/layout/CompactFooter';

export default function MorePage() {
  const items = [
    { label: 'Customer Portal & Login', href: '/profile', icon: User },
    { label: 'Reservations & Table Map', href: '/booking', icon: Calendar },
    { label: '3D & AR Food Lounge', href: '/ar', icon: Box },
    { label: 'My Favorites', href: '/favorites', icon: Heart },
    { label: 'Notifications', href: '/notifications', icon: Bell },
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'Privacy Policy', href: '/privacy', icon: ShieldCheck },
    { label: 'Terms of Service', href: '/terms', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-obsidian flex flex-col">
      <div className="flex-1 px-4 py-8 max-w-lg mx-auto w-full">
        <h1 className="font-heading text-3xl font-bold text-text-primary mb-6">Explore &amp; Account</h1>
        
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Link 
              key={item.label}
              href={item.href}
              className="flex items-center justify-between p-4 premium-glass rounded-2xl active:scale-[0.98] transition-all min-h-[64px]"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-text-primary text-base sm:text-lg truncate">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      </div>
      <CompactFooter />
    </div>
  );
}
