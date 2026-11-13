'use client';

import { useEffect, useState } from 'react';
import { Bell, Package, Tag, Info, ArrowLeft, Calendar, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useNotificationStore } from '@/store/notification-store';

export default function NotificationsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const storeNotifications = useNotificationStore((s) => s.notifications);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fallbackNotifications: Array<{
    id: string;
    title: string;
    message: string;
    time: string;
    icon: typeof Package;
    read: boolean;
    href?: string;
  }> = [
    {
      id: 'fallback-1',
      title: 'Order Preparing',
      message: 'Your order #GO-8492 is currently being prepared by our chefs.',
      time: '10 mins ago',
      icon: Package,
      read: false,
    },
    {
      id: 'fallback-2',
      title: 'Weekend Special',
      message: 'Get 15% off on all Pizzas this weekend! Use code PIZZA15.',
      time: '2 hours ago',
      icon: Tag,
      read: false,
    },
    {
      id: 'fallback-3',
      title: 'New AR Feature',
      message: 'Experience our dishes in 3D AR before ordering! Look for the 3D cube icon.',
      time: '1 day ago',
      icon: Info,
      read: true,
    },
  ];

  const items =
    isMounted && storeNotifications.length > 0
      ? storeNotifications.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: n.timestamp,
          icon:
            n.category === 'payment'
              ? CheckCircle2
              : n.category === 'table'
                ? Calendar
                : Package,
          read: n.isRead,
          href: n.actionHref,
        }))
      : fallbackNotifications;

  return (
    <div className="min-h-screen bg-obsidian text-text-primary py-6 sm:py-8 px-4">
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Back to Home"
              className="w-10 h-10 rounded-full bg-white/5 border border-border-subtle flex items-center justify-center text-text-primary/60 hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-serif text-champagne">Notifications</h1>
          </div>
          <Bell className="w-5 h-5 text-champagne/70" />
        </div>

        <div className="space-y-4">
          {items.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-xl border ${notif.read ? 'bg-[#1a1a1a] border-white/5' : 'bg-primary/5 border-primary/20'} flex gap-4 transition-all`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.read ? 'bg-white/5 text-text-primary/40' : 'bg-primary/20 text-primary'}`}>
                <notif.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className={`font-medium ${notif.read ? 'text-text-primary/80' : 'text-primary'}`}>{notif.title}</h3>
                  <span className="text-[10px] text-text-primary/40 shrink-0">{notif.time}</span>
                </div>
                <p className="text-sm text-text-primary/60 leading-relaxed">{notif.message}</p>
                {notif.href && (
                  <Link href={notif.href} className="inline-block mt-2 text-xs font-medium text-primary hover:underline">
                    View details →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
