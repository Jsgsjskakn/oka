import { Info, User, Settings, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { CompactFooter } from '@/components/layout/CompactFooter';

export default function MorePage() {
  const items = [
    { label: 'Customer Portal & Login', href: '/profile', icon: User },
    { label: 'About Us', href: '/about', icon: Info },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-obsidian flex flex-col">
      <div className="flex-1 p-4 pt-8 max-w-md mx-auto w-full">
        <h1 className="font-heading text-3xl font-bold text-text-primary mb-8">More</h1>
        
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Link 
              key={item.label}
              href={item.href}
              className="flex items-center justify-between p-4 glass-card rounded-2xl active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-text-primary text-lg">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
      <CompactFooter />
    </div>
  );
}
