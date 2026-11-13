'use client';

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
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

export const MAX_NOTIFICATIONS = 50;

// Deterministic baseline for SSR/client hydration consistency; avoids Date.now()
// skew between server pre-render and browser module evaluation.
const INITIAL_SEED_TIMESTAMP = Date.UTC(2026, 9, 29, 14, 30, 0);

const VALID_NOTIFICATION_TYPES = new Set<NotificationType>([
  'payment_success',
  'payment_failed',
  'table_confirmed',
  'order_preparing',
  'order_delivered',
  'general',
]);

const VALID_NOTIFICATION_CATEGORIES = new Set<NotificationItem['category']>([
  'payment',
  'table',
  'order',
  'general',
]);

let notificationSequence = 0;

function createNotificationId(prefix: string): string {
  notificationSequence += 1;
  if (typeof globalThis !== 'undefined' && typeof globalThis.crypto?.randomUUID === 'function') {
    return `${prefix}-${notificationSequence}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${notificationSequence}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeNotificationText(value: unknown, maxLength = 500, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  const raw = typeof value === 'string' ? value : String(value);
  const cleaned = raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return fallback;
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength - 1)}…` : cleaned;
}

function sanitizeSafeActionHref(href: unknown): string | undefined {
  if (typeof href !== 'string') return undefined;
  const trimmed = href.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  // Only allow safe internal app routes (reject protocol-relative '//' and scripts like 'javascript:')
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return undefined;
  }
  return trimmed;
}

function normalizeNotificationItem(raw: unknown): NotificationItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Record<string, unknown>;
  const id = sanitizeNotificationText(candidate.id, 120);
  const title = sanitizeNotificationText(candidate.title, 200);
  const message = sanitizeNotificationText(candidate.message, 500);
  if (!id || (!title && !message)) return null;

  const type = VALID_NOTIFICATION_TYPES.has(candidate.type as NotificationType)
    ? (candidate.type as NotificationType)
    : 'general';
  const category = VALID_NOTIFICATION_CATEGORIES.has(candidate.category as NotificationItem['category'])
    ? (candidate.category as NotificationItem['category'])
    : 'general';

  const actionType =
    candidate.actionType === 'navigate' ||
    candidate.actionType === 'retry_payment' ||
    candidate.actionType === 'track_order'
      ? candidate.actionType
      : undefined;

  return {
    id,
    title: title || 'Concierge Update',
    message: message || title,
    type,
    category,
    timestamp: sanitizeNotificationText(candidate.timestamp, 40, 'Just now'),
    createdAt:
      typeof candidate.createdAt === 'number' && Number.isFinite(candidate.createdAt)
        ? candidate.createdAt
        : INITIAL_SEED_TIMESTAMP,
    isRead: Boolean(candidate.isRead),
    actionLabel:
      candidate.actionLabel !== undefined
        ? sanitizeNotificationText(candidate.actionLabel, 80) || undefined
        : undefined,
    actionHref: sanitizeSafeActionHref(candidate.actionHref),
    actionType,
    metadata:
      candidate.metadata && typeof candidate.metadata === 'object'
        ? (candidate.metadata as NotificationItem['metadata'])
        : undefined,
  };
}

const safeLocalStorage: StateStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // Ignore storage quota or private-mode restriction errors
    }
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Ignore storage errors
    }
  },
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-pay-succ-1',
    title: 'Payment Accepted & Verified',
    message: '₹500 advance table hold deposit verified via UPI (Ref: 202610291984). Table T7 is fully locked for 2 guests.',
    type: 'payment_success',
    category: 'payment',
    timestamp: 'Just now',
    createdAt: INITIAL_SEED_TIMESTAMP - 1000 * 60 * 2, // 2 mins ago
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
    createdAt: INITIAL_SEED_TIMESTAMP - 1000 * 60 * 12, // 12 mins ago
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
    createdAt: INITIAL_SEED_TIMESTAMP - 1000 * 60 * 25, // 25 mins ago
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
    createdAt: INITIAL_SEED_TIMESTAMP - 1000 * 60 * 42,
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
    createdAt: INITIAL_SEED_TIMESTAMP - 1000 * 60 * 65,
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
        const title = sanitizeNotificationText(item?.title, 200, 'Concierge Update');
        const message = sanitizeNotificationText(item?.message, 500);
        const type = VALID_NOTIFICATION_TYPES.has(item?.type) ? item.type : 'general';
        const category = VALID_NOTIFICATION_CATEGORIES.has(item?.category)
          ? item.category
          : 'general';
        const id = createNotificationId('notif');

        const newItem: NotificationItem = {
          ...item,
          id,
          title,
          message,
          type,
          category,
          timestamp: sanitizeNotificationText(item?.timestamp, 40, 'Just now'),
          actionLabel:
            item?.actionLabel !== undefined
              ? sanitizeNotificationText(item.actionLabel, 80) || undefined
              : undefined,
          actionHref: sanitizeSafeActionHref(item?.actionHref),
          createdAt: Date.now(),
          isRead: false,
        };

        set((state) => ({
          notifications: [newItem, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
        }));

        // Trigger corresponding toast notification
        if (type === 'payment_success') {
          toast.success(newItem.title, newItem.message);
        } else if (type === 'payment_failed') {
          toast.error(newItem.title, newItem.message);
        } else {
          toast.info(newItem.title, newItem.message);
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
        const id = createNotificationId('sim');
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

          case 'table_confirmed': {
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
          }

          case 'order_preparing': {
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
          }

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
          notifications: [newItem, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
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
      version: 1,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({ notifications: state.notifications }),
      merge: (persistedState, currentState) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return currentState;
        }
        const candidateList = (persistedState as { notifications?: unknown }).notifications;
        if (!Array.isArray(candidateList)) {
          return currentState;
        }
        const sanitized = candidateList
          .map(normalizeNotificationItem)
          .filter((item): item is NotificationItem => item !== null)
          .slice(0, MAX_NOTIFICATIONS);
        return {
          ...currentState,
          notifications: sanitized,
        };
      },
    }
  )
);
