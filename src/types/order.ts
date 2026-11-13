import type { CartItem } from '@/store/cart-store';

export type OrderType = 'dine-in' | 'takeaway' | 'delivery';

export type PaymentMethod = 'upi' | 'cash';

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderDetails {
  id?: string;
  orderType: OrderType;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupTime?: string;
  deliveryAddress?: string;
  orderNotes?: string;
  promoCode?: string;
  discount?: number;
  paymentMethod: PaymentMethod;
  items: CartItem[];
  subtotal: number;
  tax: number;
  tip?: number;
  total: number;
  status: OrderStatus;
  estimatedPrepTime: string;
  createdAt: string;
}
