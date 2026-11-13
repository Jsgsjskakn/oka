import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OrderDetails } from '@/types/order';
import { useNotificationStore } from '@/store/notification-store';

export interface StoredOrderDetails extends OrderDetails {
  tip?: number;
  tableNumber?: number;
}

interface OrderStore {
  currentOrder: StoredOrderDetails | null;
  placeOrder: (
    details: Omit<StoredOrderDetails, 'id' | 'status' | 'estimatedPrepTime' | 'createdAt'> & {
      id?: string;
    }
  ) => string;
  clearOrder: () => void;
}

const generateOrderId = () => {
  return `GO-${Math.floor(1000 + Math.random() * 9000)}`;
};

const safeSessionStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null;
    try {
      return window.sessionStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(name, value);
    } catch {
      // ignore storage quota errors
    }
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

export const useOrderStore = create<OrderStore>()(
  persist(
    (set) => ({
      currentOrder: null,
      placeOrder: (details) => {
        const newId = details.id || generateOrderId();
        const order: StoredOrderDetails = {
          ...details,
          id: newId,
          status: 'received',
          estimatedPrepTime:
            details.orderType === 'takeaway'
              ? details.pickupTime || '30 min'
              : '25-35 mins',
          createdAt: new Date().toISOString(),
        };
        set({ currentOrder: order });

        useNotificationStore.getState().addNotification({
          title: `Order #${newId} Sent to Kitchen`,
          message:
            'Artisanal dishes are being prepared by our culinary team. Estimated prep time: 25-35 mins.',
          type: 'order_preparing',
          category: 'order',
          timestamp: 'Just now',
          actionLabel: 'Track Preparation',
          actionType: 'track_order',
          metadata: { orderId: newId },
        });

        return newId;
      },
      clearOrder: () => set({ currentOrder: null }),
    }),
    {
      name: 'golden-oak-order',
      storage: createJSONStorage(() => safeSessionStorage),
    }
  )
);
