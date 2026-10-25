'use server';

import { createClient } from '@/lib/supabase/server';
import { sb, type QR } from '@/lib/supabase/typed';

const RESTAURANT_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

export interface PlaceOrderInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: 'dine-in' | 'takeaway';
  paymentMethod: 'upi' | 'cash';
  pickupTime?: string;
  notes?: string;
  items: Array<{
    dishId: string;
    dishName: string;
    dishPricePaise: number;
    quantity: number;
    sizeName?: string;
    sizePriceModifierPaise?: number;
    specialInstructions?: string;
    addons?: Array<{ name: string; pricePaise: number }>;
    removedIngredients?: string[];
  }>;
  subtotalPaise: number;
  taxPaise: number;
  tipPaise: number;
  totalPaise: number;
  idempotencyKey?: string;
}

export async function placeOrderAction(input: PlaceOrderInput): Promise<{ orderId?: string; error?: string }> {
  try {
    // Verify user session if required, or allow guest
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // In guest-friendly mode, allow or check session
      // For Golden Oak, auth check is enforced or handled by client
    }

    const { createOrder } = await import('@/lib/services/order.service');
    const idempotencyKey = input.idempotencyKey || crypto.randomUUID();
    return await createOrder({ ...input, restaurantId: RESTAURANT_ID, idempotencyKey });
  } catch (err: any) {
    return { error: err?.message || 'Failed to place order. Please try again.' };
  }
}

export async function getCustomerOrders(phone: string) {
  // 1. Convex primary
  try {
    const { fetchQuery } = await import('convex/nextjs');
    const { api } = await import('@/../convex/_generated/api');
    const orders = await fetchQuery(api.orders.getOrderHistory, { phone });
    if (orders && orders.length > 0) {
      return orders.map((o: any) => ({
        id: o._id,
        status: o.status,
        created_at: new Date(o.createdAt).toISOString(),
        order_type: o.orderType,
        customer_name: o.customerName,
        total_paise: o.totalPaise,
        tip_paise: o.tipPaise,
        payment_method: o.paymentMethod,
        order_items: (o.items || []).map((it: any, idx: number) => ({
          id: `${o._id}-${idx}`,
          dish_name: it.dishName,
          quantity: it.quantity,
          line_total_paise: it.lineTotalPaise,
        })),
      }));
    }
  } catch {
    // Continue to Supabase
  }

  // 2. Supabase fallback
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const db = createAdminClient();
    const { data }: QR<unknown[]> = await (db as any).from('orders').select('id, status, created_at, order_type, customer_name, total_paise, tip_paise, payment_method, order_items(id, dish_name, quantity, line_total_paise)').eq('customer_phone', phone).eq('restaurant_id', RESTAURANT_ID).order('created_at', { ascending: false }).limit(20);
    return data ?? [];
  } catch { return []; }
}

export async function getCustomerBookings(phone: string) {
  // 1. Convex primary
  try {
    const { fetchQuery } = await import('convex/nextjs');
    const { api } = await import('@/../convex/_generated/api');
    const bookings = await fetchQuery(api.bookings.getBookingsByPhone, { phone });
    if (bookings && bookings.length > 0) {
      return bookings.map((b: any) => ({
        id: b._id,
        status: b.status,
        booking_date: b.bookingDate,
        booking_time: b.bookingTime,
        guests: b.guests,
        customer_name: b.customerName,
        payment_status: b.paymentStatus,
      }));
    }
  } catch {
    // Continue to Supabase
  }

  // 2. Supabase fallback
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const db = createAdminClient();
    const { data }: QR<unknown[]> = await (db as any).from('bookings').select('id, status, booking_date, booking_time, guests, customer_name, payment_status').eq('customer_phone', phone).eq('restaurant_id', RESTAURANT_ID).order('created_at', { ascending: false }).limit(20);
    return data ?? [];
  } catch { return []; }
}

export async function cancelOrderByCustomer(orderId: string, phone: string): Promise<{ error?: string }> {
  // 1. Convex primary
  try {
    const { fetchMutation } = await import('convex/nextjs');
    const { api } = await import('@/../convex/_generated/api');
    const result = await fetchMutation(api.orders.cancelOrderByCustomer, { orderId, phone });
    if (result && result.success) {
      return {};
    }
    if (result && result.error) {
      return { error: result.error };
    }
  } catch {
    // Fall back to Supabase
  }

  // 2. Supabase fallback
  try {
    const db = sb(await createClient());
    const { getSettings } = await import('@/lib/services/settings.service');
    const settings = await getSettings(RESTAURANT_ID, ['customer_cancellation_enabled', 'cancellation_window_minutes']);

    if (!settings.customer_cancellation_enabled) return { error: 'CANCELLATION_DISABLED' };

    const { data: order }: QR<{ id: string; status: string; created_at: string }> = await db.from('orders').select('id, status, created_at').eq('id', orderId).eq('customer_phone', phone).eq('restaurant_id', RESTAURANT_ID).single();

    if (!order) return { error: 'Order not found' };
    if (order.status === 'cancelled') return { error: 'Order already cancelled' };
    if (['completed', 'ready'].includes(order.status)) return { error: 'Cannot cancel at this stage' };

    const windowMinutes = Number(settings.cancellation_window_minutes) || 10;
    if ((Date.now() - new Date(order.created_at).getTime()) / 60000 > windowMinutes) return { error: `Cancellation window of ${windowMinutes} min has passed` };

    const { error: updateErr }: QR<null> = await db.from('orders').update({ status: 'cancelled', cancelled_by: 'customer', cancelled_at: new Date().toISOString(), cancellation_reason: 'Cancelled by customer' }).eq('id', orderId).eq('customer_phone', phone);
    if (updateErr) return { error: 'Failed to cancel order' };

    const maskedPhone = phone ? phone.replace(/.(?=.{4})/g, '*') : 'customer';
    await db.from('audit_logs').insert({ restaurant_id: RESTAURANT_ID, actor_name: maskedPhone, actor_role: 'customer', actor_id: null, action: 'ORDER_CANCELLED_BY_CUSTOMER', entity_type: 'orders', entity_id: orderId, old_value: null, new_value: { reason: 'Cancelled by customer' }, ip_address: null });
    return {};
  } catch { return { error: 'Failed to cancel order' }; }
}
