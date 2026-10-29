import { create } from 'zustand';
import type { OrderDetails } from '@/types/order';
import type { CartItem } from '@/store/cart-store';
import { useNotificationStore } from '@/store/notification-store';

interface OrderStore {
  currentOrder: OrderDetails | null;
  placeOrder: (details: Omit<OrderDetails, 'id' | 'status' | 'estimatedPrepTime' | 'createdAt'>) => string;
  clearOrder: () => void;
}

const generateOrderId = () => {
  return `GO-${Math.floor(1000 + Math.random() * 9000)}`;
};

export const useOrderStore = create<OrderStore>((set) => ({
  currentOrder: null,
  placeOrder: (details) => {
    const newId = generateOrderId();
    const order: OrderDetails = {
      ...details,
      id: newId,
      status: 'received',
      estimatedPrepTime: '25-35 mins',
      createdAt: new Date().toISOString(),
    };
    set({ currentOrder: order });

    useNotificationStore.getState().addNotification({
      title: `Order #${newId} Sent to Kitchen`,
      message: 'Artisanal dishes are being prepared by our culinary team. Estimated prep time: 25-35 mins.',
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
}));
