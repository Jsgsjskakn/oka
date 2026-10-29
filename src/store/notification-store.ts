'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from '@/store/toast-store';

export type NotificationType =
  | 'payment_success'
  | 'payment_failed'
  | 'table_confirmed'
  | 'order_preparing'
  | 'order_delivered'
  | 'general';

export type NotificationCategory = 'all' | 'payment' | 'table' | 'order';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: 'payment' | 'table' | 'order' | 'general';
  timestamp: string;
  createdAt: number;
  isRead: boolean;
  actionLabel?: string;
  actionHref?: string;
  actionType?: 'navigate' | 'retry_payment' | 'track_order';
  metadata?: {
    amountPaise?: number;
    tableNumber?: number;
    orderId?: string;
    utr?: string;
  };
}

interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: () => number;
  addNotification: (item: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>) => string;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  simulateNotification: (type: NotificationType) => void;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-pay-succ-1',
    title: 'Payment Accepted & Verified',
    message: '₹500 advance table hold deposit verified via UPI (Ref: 202610291984). Table T7 is fully locked for 2 guests.',
    type: 'payment_success',
    category: 'payment',
    timestamp: 'Just now',
    createdAt: Date.now() - 1000 * 60 * 2, // 2 mins ago
    isRead: false,
    actionLabel: 'View Booking Receipt →',
    actionHref: '/booking',
    actionType: 'navigate',
    metadata: { amountPaise: 50000, tableNumber: 7, utr: '202610291984' },
  },
  {
    id: 'notif-pay-fail-1',
    title: 'Payment Verification Failed',
    message: 'UPI transaction of ₹1,499 for Order #GO-8921 timed out with issuing bank. Please retry payment to avoid order cancellation.',
    type: 'payment_failed',
    category: 'payment',
    timestamp: '12m ago',
    createdAt: Date.now() - 1000 * 60 * 12, // 12 mins ago
    isRead: false,
    actionLabel: 'Retry UPI Payment ↺',
    actionType: 'retry_payment',
    metadata: { amountPaise: 149900, orderId: 'GO-8921' },
  },
  {
    id: 'notif-table-conf-1',
    title: 'Table Reserved — The Hearth Chef\'s Counter',
    message: 'Table #07 is allocated for 2 Guests on Thu, Oct 29 at 08:00 PM. Your 5-minute allocation window is confirmed active.',
    type: 'table_confirmed',
    category: 'table',
    timestamp: '25m ago',
    createdAt: Date.now() - 1000 * 60 * 25, // 25 mins ago
    isRead: false,
    actionLabel: 'Open 3D Floorplan →',
    actionHref: '/booking',
    actionType: 'navigate',
    metadata: { tableNumber: 7 },
  },
  {
    id: 'notif-order-prep-1',
    title: 'Order In Kitchen — Stone Hearth',
    message: 'Order #GO-4821 (Chicken Tikka Pizza, Truffle Fries) is being stone-baked in our wood-fired oven by Chef Antonio.',
    type: 'order_preparing',
    category: 'order',
    timestamp: '42m ago',
    createdAt: Date.now() - 1000 * 60 * 42,
    isRead: true,
    actionLabel: 'Track Live Preparation',
    actionType: 'track_order',
    metadata: { orderId: 'GO-4821' },
  },
  {
    id: 'notif-order-deliv-1',
    title: 'Artisanal Dishes Served at Table T7',
    message: 'Your wood-fired dishes and crafted refreshments have been presented at Table T7. Enjoy your dining experience!',
    type: 'order_delivered',
    category: 'order',
    timestamp: '1h ago',
    createdAt: Date.now() - 1000 * 60 * 65,
    isRead: true,
    actionLabel: 'Explore Menu for Dessert →',
    actionHref: '/menu',
    actionType: 'navigate',
    metadata: { orderId: 'GO-4821', tableNumber: 7 },
  },
];

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: INITIAL_NOTIFICATIONS,

      unreadCount: () => {
        return get().notifications.filter((n) => !n.isRead).length;
      },

      addNotification: (item) => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newItem: NotificationItem = {
          ...item,
          id,
          createdAt: Date.now(),
          isRead: false,
        };

        set((state) => ({
          notifications: [newItem, ...state.notifications],
        }));

        // Trigger corresponding toast notification
        if (item.type === 'payment_success') {
          toast.success(item.title, item.message);
        } else if (item.type === 'payment_failed') {
          toast.error(item.title, item.message);
        } else {
          toast.info(item.title, item.message);
        }

        return id;
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        }));
        toast.info('Notifications Updated', 'All concierge notifications marked as read.');
      },

      deleteNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clearAll: () => {
        set({ notifications: [] });
        toast.info('Notifications Cleared', 'All notifications have been removed.');
      },

      simulateNotification: (type) => {
        const id = `sim-${Date.now()}`;
        let newItem: NotificationItem;

        switch (type) {
          case 'payment_success':
            newItem = {
              id,
              title: 'Payment Accepted & Verified',
              message: `UPI Payment of ₹${(Math.floor(Math.random() * 8 + 3) * 100)} verified successfully. Table hold receipt issued.`,
              type: 'payment_success',
              category: 'payment',
              timestamp: 'Just now',
              createdAt: Date.now(),
              isRead: false,
              actionLabel: 'View Receipt →',
              actionHref: '/booking',
              actionType: 'navigate',
            };
            break;

          case 'payment_failed':
            newItem = {
              id,
              title: 'Payment Verification Failed',
              message: 'UPI transaction timed out before bank confirmation. Tap below to retry payment.',
              type: 'payment_failed',
              category: 'payment',
              timestamp: 'Just now',
              createdAt: Date.now(),
              isRead: false,
              actionLabel: 'Retry UPI Payment ↺',
              actionType: 'retry_payment',
            };
            break;

          case 'table_confirmed':
            const tableNum = [3, 7, 12, 18, 25][Math.floor(Math.random() * 5)];
            newItem = {
              id,
              title: `Table #${tableNum} Allocated — Verified`,
              message: `Seating confirmed for Table #${tableNum} (Premium Rotunda Zone). Chef's welcome drink ready.`,
              type: 'table_confirmed',
              category: 'table',
              timestamp: 'Just now',
              createdAt: Date.now(),
              isRead: false,
              actionLabel: 'View in 3D Floorplan →',
              actionHref: '/booking',
              actionType: 'navigate',
            };
            break;

          case 'order_preparing':
            const orderNum = `GO-${Math.floor(1000 + Math.random() * 9000)}`;
            newItem = {
              id,
              title: `Order ${orderNum} Fired in Kitchen`,
              message: 'Wood-fired oven preheated to 450°C. Artisanal toppings assembled by kitchen team.',
              type: 'order_preparing',
              category: 'order',
              timestamp: 'Just now',
              createdAt: Date.now(),
              isRead: false,
              actionLabel: 'Track Preparation',
              actionType: 'track_order',
            };
            break;

          case 'order_delivered':
            newItem = {
              id,
              title: 'Dishes Served at Your Table',
              message: 'Fresh dishes served at your table. Bon appétit!',
              type: 'order_delivered',
              category: 'order',
              timestamp: 'Just now',
              createdAt: Date.now(),
              isRead: false,
              actionLabel: 'Order Dessert →',
              actionHref: '/menu',
              actionType: 'navigate',
            };
            break;

          default:
            newItem = {
              id,
              title: 'Concierge Alert',
              message: 'Live concierge notification received.',
              type: 'general',
              category: 'general',
              timestamp: 'Just now',
              createdAt: Date.now(),
              isRead: false,
            };
        }

        set((state) => ({
          notifications: [newItem, ...state.notifications],
        }));

        if (newItem.type === 'payment_success') {
          toast.success(newItem.title, newItem.message);
        } else if (newItem.type === 'payment_failed') {
          toast.error(newItem.title, newItem.message);
        } else {
          toast.info(newItem.title, newItem.message);
        }
      },
    }),
    {
      name: 'golden-oak-concierge-notifications',
      partialize: (state) => ({ notifications: state.notifications }),
    }
  )
);
