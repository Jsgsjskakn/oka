'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Calendar,
  UtensilsCrossed,
  Sparkles,
  X,
  ChefHat,
  ChevronRight,
} from 'lucide-react';
import {
  useNotificationStore,
  type NotificationItem,
  type NotificationCategory,
} from '@/store/notification-store';
import { toast } from '@/store/toast-store';

export function NotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationCategory>('all');
  const [isMounted, setIsMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount());
  const markAsRead = useNotificationStore((s) => s.markAsRead);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close panel on outside click or escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter notifications by category
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  const paymentCount = notifications.filter((n) => n.category === 'payment').length;
  const tableCount = notifications.filter((n) => n.category === 'table').length;
  const orderCount = notifications.filter((n) => n.category === 'order').length;

  const handleActionClick = (item: NotificationItem) => {
    markAsRead(item.id);

    if (item.actionType === 'retry_payment') {
      toast.info(
        'UPI Payment Gateway Ready',
        'Redirecting to UPI payment verification for your reserved table...'
      );
      router.push('/booking');
      setIsOpen(false);
    } else if (item.actionType === 'track_order') {
      toast.success(
        'Live Kitchen Status: Firing',
        'Chef Antonio is stone-baking your wood-fired dish at 450°C. ETA: ~12 mins.'
      );
      setIsOpen(false);
    } else if (item.actionHref) {
      router.push(item.actionHref);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* ========================================================= */}
      {/* 1. BELL TRIGGER BUTTON (LUXURY MINIMALIST TRIGGER)       */}
      {/* ========================================================= */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Concierge Notifications, ${isMounted ? unreadCount : 0} unread`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="Concierge Desk & Live Updates"
        className={`relative min-w-[48px] min-h-[48px] rounded-full transition-all flex items-center justify-center group active:scale-95 cursor-pointer shrink-0 touch-manipulation ${
          isOpen
            ? 'text-[#D6B77A] bg-[#D6B77A]/15 ring-1 ring-[#D6B77A]/40 shadow-[0_0_14px_rgba(214,183,122,0.3)]'
            : 'text-[#B5ADA2] hover:text-[#FAF5EC] hover:bg-white/[0.05]'
        }`}
      >
        <Bell className="w-4 h-4 transition-transform group-hover:scale-110" />

        {/* Refined Unread Counter Badge */}
        {isMounted && unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-[#D6B77A] text-black text-[9px] font-sans font-bold flex items-center justify-center shadow-[0_0_8px_rgba(214,183,122,0.6)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ========================================================= */}
      {/* 2. FLOATING BESPOKE CONCIERGE DESK PANEL                  */}
      {/* ========================================================= */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Concierge Notifications Panel"
          className="fixed inset-x-3 top-[72px] sm:inset-x-auto sm:absolute sm:right-[-40px] md:right-[-10px] sm:top-[calc(100%+12px)] w-auto sm:w-[420px] max-h-[calc(100dvh-96px)] z-50 rounded-2xl border border-[#D6B77A]/25 shadow-[0_24px_60px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.12),0_0_25px_rgba(214,183,122,0.06)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{
            background: 'linear-gradient(180deg, rgba(14, 12, 10, 0.98) 0%, rgba(8, 7, 6, 0.98) 100%)',
            backdropFilter: 'blur(32px) saturate(190%)',
            WebkitBackdropFilter: 'blur(32px) saturate(190%)',
          }}
        >
          {/* Subtle Champagne Top Hairline */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#D6B77A]/50 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="p-4 pb-3.5 border-b border-white/[0.07] flex items-center justify-between gap-3 bg-black/25">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D6B77A]/20 to-black/40 border border-[#D6B77A]/30 flex items-center justify-center text-[#D6B77A] shadow-[0_0_12px_rgba(214,183,122,0.15)] shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-heading font-medium tracking-wide text-[#FAF5EC] leading-tight">
                    Concierge Desk
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#D6B77A]/15 border border-[#D6B77A]/30 text-[#D6B77A] text-[9.5px] font-sans font-medium tracking-wider uppercase">
                      {unreadCount} Active
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] text-[#A6A29A] font-light tracking-wide mt-0.5">
                  Bespoke dining, reservations &amp; cellar updates
                </p>
              </div>
            </div>

            {/* Header Actions - Pure Minimalist Close Only (Mark as Read and Delete options removed) */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              title="Close Concierge Desk"
              className="w-7 h-7 rounded-full text-[#A6A29A] hover:text-[#FAF5EC] hover:bg-white/[0.06] flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Category Filter Tabs */}
          <div className="px-3.5 py-2 border-b border-white/[0.06] flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-black/20">
            {[
              { id: 'all', label: 'All', count: notifications.length },
              { id: 'payment', label: 'Payments', count: paymentCount },
              { id: 'table', label: 'Table / Seat', count: tableCount },
              { id: 'order', label: 'Orders', count: orderCount },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as NotificationCategory)}
                  className={`px-3 py-1 rounded-full text-[11.5px] transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer select-none ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#D6B77A]/15 to-[#D6B77A]/05 text-[#FAF5EC] border border-[#D6B77A]/35 shadow-sm font-medium'
                      : 'text-[#8E877E] hover:text-[#FAF5EC] hover:bg-white/[0.03] border border-transparent font-normal'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-[#D6B77A]/25 text-[#D6B77A] font-semibold'
                        : 'bg-white/05 text-[#8E877E]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Notification List Scroll Area */}
          <div className="max-h-[340px] sm:max-h-[380px] overflow-y-auto divide-y divide-white/[0.05] scrollbar-thin">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
                <div className="relative mb-3.5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-b from-[#D6B77A]/15 to-transparent border border-[#D6B77A]/25 flex items-center justify-center text-[#D6B77A] shadow-[0_0_20px_rgba(214,183,122,0.12)]">
                    <UtensilsCrossed className="w-5 h-5 opacity-80" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-[#D6B77A]/10 blur-xl -z-10 pointer-events-none" />
                </div>
                <h4 className="font-heading text-sm font-medium tracking-wide text-[#FAF5EC] mb-1.5">
                  Concierge Ledger Pristine
                </h4>
                <p className="text-[11.5px] text-[#A6A29A] max-w-[260px] font-light leading-relaxed">
                  Your dining reservations, sommelier selections, and table updates will be gracefully presented here in real time.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                return (
                  <div
                    key={item.id}
                    onClick={() => handleActionClick(item)}
                    className={`p-4 transition-all relative flex gap-3.5 group cursor-pointer ${
                      !item.isRead
                        ? 'bg-[#D6B77A]/[0.03] hover:bg-[#D6B77A]/[0.06] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:rounded-r before:bg-gradient-to-b before:from-[#D6B77A] before:to-[#C5A059]'
                        : 'hover:bg-white/[0.025]'
                    }`}
                  >
                    {/* Bespoke Muted Luxury Icon by Type */}
                    <div className="shrink-0 mt-0.5">
                      {item.type === 'payment_success' && (
                        <div className="w-8 h-8 rounded-full bg-[#12241A] border border-[#2E5A47]/60 text-[#5ED49F] flex items-center justify-center shadow-[0_0_12px_rgba(94,212,159,0.15)]">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                      {item.type === 'payment_failed' && (
                        <div className="w-8 h-8 rounded-full bg-[#2A1215] border border-[#5A252B]/60 text-[#E07A85] flex items-center justify-center shadow-[0_0_12px_rgba(224,122,133,0.15)]">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      )}
                      {item.type === 'table_confirmed' && (
                        <div className="w-8 h-8 rounded-full bg-[#231A0F] border border-[#7A5C30]/60 text-[#D6B77A] flex items-center justify-center shadow-[0_0_12px_rgba(214,183,122,0.15)]">
                          <Calendar className="w-4 h-4" />
                        </div>
                      )}
                      {item.type === 'order_preparing' && (
                        <div className="w-8 h-8 rounded-full bg-[#241B0E] border border-[#6B4B1E]/60 text-[#E5A952] flex items-center justify-center shadow-[0_0_12px_rgba(229,169,82,0.15)]">
                          <ChefHat className="w-4 h-4" />
                        </div>
                      )}
                      {item.type === 'order_delivered' && (
                        <div className="w-8 h-8 rounded-full bg-[#18181C] border border-white/20 text-[#E8E5DE] flex items-center justify-center shadow-[0_0_12px_rgba(232,229,222,0.15)]">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}
                      {item.type === 'general' && (
                        <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 text-[#FAF5EC] flex items-center justify-center">
                          <Bell className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="text-xs font-medium text-[#FAF5EC] truncate leading-tight">
                            {item.title}
                          </h4>
                          {!item.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D6B77A] shadow-[0_0_6px_#D6B77A] shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-[#8E877E] shrink-0">
                          {item.timestamp}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#A6A29A] font-light leading-relaxed mb-2.5">
                        {item.message}
                      </p>

                      {/* Interactive Action Link (Refined luxury affordance) */}
                      {item.actionLabel && (
                        <div className="inline-flex items-center gap-1.5 text-[10.5px] font-medium tracking-wide text-[#D6B77A] group-hover:text-white transition-colors">
                          <span>{item.actionLabel}</span>
                          <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ========================================================= */}
          {/* 3. REFINED CONCIERGE STATUS FOOTER                       */}
          {/* ========================================================= */}
          <div className="px-4 py-2.5 bg-black/40 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 text-[#A6A29A]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#36D6A0] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#36D6A0]" />
              </span>
              <span className="font-light tracking-wide text-[10.5px]">Concierge Desk Online</span>
            </div>
            <span className="text-[9.5px] font-mono tracking-widest uppercase text-[#D6B77A]/75">The Golden Oak</span>
          </div>
        </div>
      )}
    </div>
  );
}
