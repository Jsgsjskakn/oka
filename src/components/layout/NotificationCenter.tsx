'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Calendar,
  UtensilsCrossed,
  Sparkles,
  Clock,
  X,
  CheckCheck,
  Trash2,
  RefreshCw,
  ChefHat,
  ArrowRight,
  CreditCard,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  useNotificationStore,
  type NotificationItem,
  type NotificationCategory,
  type NotificationType,
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
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const deleteNotification = useNotificationStore((s) => s.deleteNotification);
  const clearAll = useNotificationStore((s) => s.clearAll);
  const simulateNotification = useNotificationStore((s) => s.simulateNotification);

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
        'Chef Antonio is stone-baking your wood-fired pizza at 450°C. ETA: ~12 mins.'
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
      {/* 1. BELL TRIGGER BUTTON (EXACT LOCATION IN RED BOX)       */}
      {/* ========================================================= */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Concierge Notifications, ${isMounted ? unreadCount : 0} unread`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="Concierge Notifications & Live Alerts"
        className={`relative p-1.5 rounded-full transition-all flex items-center justify-center group active:scale-95 cursor-pointer shrink-0 ${
          isOpen
            ? 'text-[#F0C36B] bg-[#F0C36B]/15 ring-1 ring-[#F0C36B]/40 shadow-[0_0_12px_rgba(240,195,107,0.35)]'
            : 'text-[#B5ADA2] hover:text-[#FAF5EC] hover:bg-white/[0.05]'
        }`}
      >
        <Bell className="w-4 h-4 transition-transform group-hover:scale-110" />

        {/* Unread Counter Badge */}
        {isMounted && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F0C36B] text-black text-[9px] font-mono font-bold flex items-center justify-center shadow-[0_0_10px_rgba(240,195,107,0.7)] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ========================================================= */}
      {/* 2. FLOATING LUXURY GLASS NOTIFICATION CENTER PANEL        */}
      {/* ========================================================= */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Concierge Notifications Panel"
          className="absolute right-0 sm:right-[-60px] md:right-[-20px] top-[calc(100%+12px)] w-[330px] sm:w-[420px] max-w-[94vw] z-50 rounded-2xl border border-[#F0C36B]/40 shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.18)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{
            background: 'rgba(16, 12, 9, 0.96)',
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          }}
        >
          {/* Header */}
          <div className="p-4 pb-3 border-b border-[#F0C36B]/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F0C36B]/15 border border-[#F0C36B]/30 flex items-center justify-center text-[#F0C36B] shadow-sm">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-serif font-bold text-[#FAF5EC] leading-tight">
                    Concierge Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#36D6A0]/15 border border-[#36D6A0]/40 text-[#36D6A0] text-[10px] font-mono font-semibold">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <span className="text-[10.5px] text-[#9A9286] font-light">
                  Live table, payment &amp; dining alerts
                </span>
              </div>
            </div>

            {/* Quick Header Actions */}
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  className="p-1.5 rounded-lg text-[#9A9286] hover:text-[#F0C36B] hover:bg-white/[0.05] transition-all cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  title="Clear all notifications"
                  className="p-1.5 rounded-lg text-[#9A9286] hover:text-rose-400 hover:bg-white/[0.05] transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 rounded-lg text-[#9A9286] hover:text-[#FAF5EC] hover:bg-white/[0.05] transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="px-3 pt-2 pb-1.5 border-b border-white/[0.06] flex items-center gap-1 overflow-x-auto scrollbar-none">
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#F0C36B]/20 text-[#FFE3A5] border border-[#F0C36B]/50 font-semibold'
                      : 'text-[#9A9286] hover:text-[#FAF5EC] hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[9.5px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-[#F0C36B] text-black font-bold'
                        : 'bg-white/10 text-white/60'
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
                <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#9A9286] mb-3">
                  <UtensilsCrossed className="w-5 h-5 opacity-60" />
                </div>
                <h4 className="text-xs font-serif font-bold text-[#FAF5EC] mb-1">
                  All Caught Up
                </h4>
                <p className="text-[11px] text-[#9A9286] max-w-[220px]">
                  No active alerts in this category. You will be notified of real-time seat, payment and order updates.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                return (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className={`p-3.5 sm:p-4 transition-colors relative flex gap-3 group cursor-pointer ${
                      !item.isRead
                        ? 'bg-[#F0C36B]/[0.06] hover:bg-[#F0C36B]/[0.10]'
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    {/* Icon by Type */}
                    <div className="shrink-0 mt-0.5">
                      {item.type === 'payment_success' && (
                        <div className="w-8 h-8 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[#36D6A0] flex items-center justify-center shadow-[0_0_10px_rgba(54,214,160,0.25)]">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                      {item.type === 'payment_failed' && (
                        <div className="w-8 h-8 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-[0_0_10px_rgba(244,63,94,0.25)]">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      )}
                      {item.type === 'table_confirmed' && (
                        <div className="w-8 h-8 rounded-full bg-[#20150A] border border-[#F0C36B]/50 text-[#F0C36B] flex items-center justify-center shadow-[0_0_10px_rgba(240,195,107,0.25)]">
                          <Calendar className="w-4 h-4" />
                        </div>
                      )}
                      {item.type === 'order_preparing' && (
                        <div className="w-8 h-8 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.25)]">
                          <ChefHat className="w-4 h-4" />
                        </div>
                      )}
                      {item.type === 'order_delivered' && (
                        <div className="w-8 h-8 rounded-full bg-sky-950/60 border border-sky-500/40 text-sky-400 flex items-center justify-center shadow-[0_0_10px_rgba(56,189,248,0.25)]">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}
                      {item.type === 'general' && (
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 text-[#FAF5EC] flex items-center justify-center">
                          <Bell className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="text-xs font-semibold text-[#FAF5EC] truncate leading-tight">
                            {item.title}
                          </h4>
                          {!item.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#F0C36B] shadow-[0_0_6px_#F0C36B] shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-[#9A9286] shrink-0">
                          {item.timestamp}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#C4B8A8] font-light leading-relaxed mb-2">
                        {item.message}
                      </p>

                      {/* Interactive Action Button */}
                      {item.actionLabel && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActionClick(item);
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10.5px] font-mono font-bold transition-all cursor-pointer active:scale-95 ${
                              item.type === 'payment_failed'
                                ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                                : item.type === 'payment_success'
                                  ? 'bg-[#36D6A0]/15 border border-[#36D6A0]/40 text-[#36D6A0] hover:bg-[#36D6A0]/25'
                                  : 'bg-[#F0C36B]/15 border border-[#F0C36B]/40 text-[#F0C36B] hover:bg-[#F0C36B]/25'
                            }`}
                          >
                            <span>{item.actionLabel}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Delete Item Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(item.id);
                      }}
                      title="Dismiss notification"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#9A9286] hover:text-[#FAF5EC] shrink-0 self-start cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* ========================================================= */}
          {/* 3. SIMULATOR DOCK (INSTANT LIVE TESTING OF ALL NOTIFS)    */}
          {/* ========================================================= */}
          <div className="p-3 bg-black/60 border-t border-[#F0C36B]/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#F0C36B] uppercase tracking-wider flex items-center gap-1">
                <span>⚡ Simulate Live Alerts</span>
              </span>
              <span className="text-[9.5px] text-[#9A9286]">Instant Dispatch</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => simulateNotification('payment_success')}
                className="px-1.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono hover:bg-emerald-950/80 transition-all cursor-pointer active:scale-95 truncate text-center"
                title="Simulate Payment Accepted Notification"
              >
                + Paid ✓
              </button>

              <button
                type="button"
                onClick={() => simulateNotification('payment_failed')}
                className="px-1.5 py-1 rounded-md bg-rose-950/40 border border-rose-500/30 text-rose-400 text-[10px] font-mono hover:bg-rose-950/80 transition-all cursor-pointer active:scale-95 truncate text-center"
                title="Simulate Payment Failed Notification"
              >
                + Fail ✕
              </button>

              <button
                type="button"
                onClick={() => simulateNotification('table_confirmed')}
                className="px-1.5 py-1 rounded-md bg-[#F0C36B]/10 border border-[#F0C36B]/30 text-[#F0C36B] text-[10px] font-mono hover:bg-[#F0C36B]/20 transition-all cursor-pointer active:scale-95 truncate text-center"
                title="Simulate Seat / Table Reserved Notification"
              >
                + Seat 🍽️
              </button>

              <button
                type="button"
                onClick={() => simulateNotification('order_preparing')}
                className="px-1.5 py-1 rounded-md bg-amber-950/40 border border-amber-500/30 text-amber-400 text-[10px] font-mono hover:bg-amber-950/80 transition-all cursor-pointer active:scale-95 truncate text-center"
                title="Simulate Order In Kitchen Notification"
              >
                + Order 🔥
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
