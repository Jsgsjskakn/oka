import type { CartItem } from '@/store/cart-store';

export type OrderType = 'dine-in' | 'takeaway';

export type PaymentMethod = 'upi' | 'cash';

export type OrderStatus = 'received' | 'preparing' | 'ready';

export interface OrderDetails {
  id?: string;
  orderType: OrderType;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupTime?: string;
  orderNotes?: string;
  paymentMethod: PaymentMethod;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  estimatedPrepTime: string;
  createdAt: string;
}
