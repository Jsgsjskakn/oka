import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@/../convex/_generated/api';
import { createClient } from '@/lib/supabase/server';
import { sb, type QR } from '@/lib/supabase/typed';
import type { OrderWithItems, OrderStatus } from '@/lib/db/types';
import { getSessionToken } from '@/lib/auth/admin-auth';

export interface CreateOrderInput {
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: 'dine-in' | 'takeaway';
  tableNumber?: number;
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
  idempotencyKey: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  phone?: string;
}


function mapConvexOrder(order: any): OrderWithItems {
  return {
    id: order._id,
    restaurant_id: RESTAURANT_ID,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_email: order.customerEmail || null,
    order_type: order.orderType,
    table_id: null,
    status: order.status,
    payment_status: order.paymentStatus,
    payment_method: order.paymentMethod,
    pickup_time: order.pickupTime || null,
    notes: order.notes || null,
    subtotal_paise: order.subtotalPaise,
    tax_paise: order.taxPaise,
    tip_paise: order.tipPaise,
    total_paise: order.totalPaise,
    idempotency_key: order.idempotencyKey || null,
    cancelled_at: null,
    cancelled_by: null,
    cancellation_reason: null,
    processed_by: null,
    created_at: new Date(order.createdAt).toISOString(),
    updated_at: new Date(order.createdAt).toISOString(),
    order_items: (order.items || []).map((item: any, idx: number) => ({
      id: `item-${idx}`,
      order_id: order._id,
      dish_id: item.dishId,
      dish_name: item.dishName,
      dish_price_paise: item.dishPricePaise,
      quantity: item.quantity,
      size_name: item.sizeName || null,
      size_price_modifier_paise: item.sizePriceModifierPaise || 0,
      special_instructions: item.specialInstructions || null,
      line_total_paise: item.lineTotalPaise,
      created_at: new Date(order.createdAt).toISOString(),
      order_item_customizations: [],
    })),
  };
}

const RESTAURANT_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

export async function createOrder(data: CreateOrderInput): Promise<{ orderId: string; error?: string }> {
  // 1. Primary: Convex Mutation
  try {
    const result = await fetchMutation(api.orders.placeOrder, {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      orderType: data.orderType,
      tableNumber: data.tableNumber,
      paymentMethod: data.paymentMethod,
      pickupTime: data.pickupTime,
      notes: data.notes,
      tipPaise: data.tipPaise,
      idempotencyKey: data.idempotencyKey,
      items: data.items.map((i) => ({
        dishId: i.dishId,
        dishName: i.dishName,
        dishPricePaise: i.dishPricePaise,
        quantity: i.quantity,
        sizeName: i.sizeName,
        sizePriceModifierPaise: i.sizePriceModifierPaise,
        lineTotalPaise: (i.dishPricePaise + (i.sizePriceModifierPaise || 0) + (i.addons || []).reduce((sum, a) => sum + (a.pricePaise || 0), 0)) * i.quantity,
        specialInstructions: i.specialInstructions,
        addons: i.addons?.map((a) => ({ name: a.name, pricePaise: a.pricePaise })),
        removedIngredients: i.removedIngredients,
      })),
    });

    if (result?.orderId) {
      return { orderId: result.orderId };
    }
  } catch (convexError) {
    console.warn('[order.service] Convex placeOrder failed, falling back to Supabase:', convexError);
  }

  // 2. Secondary Fallback: Supabase
  try {
    const client = await createClient();
    const db = sb(client);

    // Idempotency check
    const { data: existing }: QR<{ id: string }> = await db
      .from('orders')
      .select('id')
      .eq('idempotency_key', data.idempotencyKey)
      .maybeSingle();

    if (existing) return { orderId: existing.id };

    let tableId: string | null = null;
    if (data.orderType === 'dine-in' && data.tableNumber) {
      const { data: t }: QR<{ id: string }> = await db
        .from('tables')
        .select('id')
        .eq('table_number', data.tableNumber)
        .eq('restaurant_id', data.restaurantId)
        .maybeSingle();
      if (t) tableId = t.id;
    }

    const { getSetting } = await import('@/lib/services/settings.service');
    const taxRatePercent = Number(await getSetting(data.restaurantId, 'tax_rate_percent')) || 5;
    const calculatedTaxPaise = Math.round(data.subtotalPaise * (taxRatePercent / 100));
    const calculatedTotalPaise = data.subtotalPaise + calculatedTaxPaise + data.tipPaise;

    const { data: { user } } = await client.auth.getUser();

    const { data: order, error: orderError }: QR<{ id: string }> = await db
      .from('orders')
      .insert({
        restaurant_id: data.restaurantId,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: data.customerEmail ?? null,
        order_type: data.orderType,
        table_id: tableId,
        status: 'pending',
        payment_status: 'pending',
        payment_method: data.paymentMethod,
        pickup_time: data.pickupTime ?? null,
        notes: data.notes ?? null,
        subtotal_paise: data.subtotalPaise,
        tax_paise: calculatedTaxPaise,
        tip_paise: data.tipPaise,
        total_paise: calculatedTotalPaise,
        idempotency_key: data.idempotencyKey,
        user_id: user?.id ?? null,
      })
      .select('id')
      .single();

    if (orderError || !order) throw orderError ?? new Error('Order insert failed');

    // Also insert items into order_items and order_item_customizations for Supabase fallback
    if (data.items && data.items.length > 0) {
      const orderItemsRows = data.items.map((item) => {
        const addonsTotalPaise = (item.addons || []).reduce((sum, a) => sum + (a.pricePaise || 0), 0);
        return {
          order_id: order.id,
          dish_id: item.dishId,
          dish_name: item.dishName,
          dish_price_paise: item.dishPricePaise,
          quantity: item.quantity,
          size_name: item.sizeName ?? null,
          size_price_modifier_paise: item.sizePriceModifierPaise ?? 0,
          special_instructions: item.specialInstructions ?? null,
          line_total_paise: (item.dishPricePaise + (item.sizePriceModifierPaise || 0) + addonsTotalPaise) * item.quantity,
        };
      });

      const { data: insertedItems, error: itemsError }: QR<{ id: string; dish_name: string }[]> = await db
        .from('order_items')
        .insert(orderItemsRows)
        .select('id, dish_name');

      if (!itemsError && insertedItems) {
        const customizationRows: any[] = [];
        data.items.forEach((item, idx) => {
          const insertedItem = insertedItems[idx];
          if (!insertedItem) return;
          item.addons?.forEach((addon) => {
            customizationRows.push({
              order_item_id: insertedItem.id,
              type: 'addon',
              name: addon.name,
              price_paise: addon.pricePaise,
            });
          });
        });

        if (customizationRows.length > 0) {
          await db.from('order_item_customizations').insert(customizationRows);
        }
      }
    }

    return { orderId: order.id };
  } catch (err) {
    console.error('createOrder error:', err);
    return { orderId: '', error: 'Failed to create order' };
  }
}

export async function getOrdersByPhone(phone?: string, email?: string): Promise<OrderWithItems[]> {
  // 1. Try Convex primary
  try {
    const orders = await fetchQuery(api.orders.getOrderHistory, {
      phone: phone || undefined,
      email: email || undefined,
    });
    if (orders && orders.length > 0) {
      return orders.map((o: any) => mapConvexOrder(o));
    }
  } catch (convexErr) {
    console.warn('[order.service] Convex getOrdersByPhone failed, trying Supabase:', convexErr);
  }

  // 2. Supabase fallback
  try {
    const db = sb(await createClient());
    let query = db
      .from('orders')
      .select('*, order_items(*, order_item_customizations(*))')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('created_at', { ascending: false })
      .limit(20);
    if (phone) {
      query = query.eq('customer_phone', phone);
    } else if (email) {
      query = query.eq('customer_email', email);
    }
    const { data }: QR<OrderWithItems[]> = await query;
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getOrderById(orderId: string): Promise<OrderWithItems | null> {
  // 1. Try Convex
  try {
    const order = await fetchQuery(api.orders.getOrderById, { orderId: orderId as any });
    if (order) {
      return {
        id: order._id,
        restaurant_id: RESTAURANT_ID,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        customer_email: order.customerEmail || null,
        order_type: order.orderType,
        table_id: null,
        status: order.status,
        payment_status: order.paymentStatus,
        payment_method: order.paymentMethod,
        pickup_time: order.pickupTime || null,
        notes: order.notes || null,
        subtotal_paise: order.subtotalPaise,
        tax_paise: order.taxPaise,
        tip_paise: order.tipPaise,
        total_paise: order.totalPaise,
        idempotency_key: order.idempotencyKey || null,
        cancelled_at: null,
        cancelled_by: null,
        cancellation_reason: null,
        processed_by: null,
        created_at: new Date(order.createdAt).toISOString(),
        updated_at: new Date(order.createdAt).toISOString(),
        order_items: order.items.map((item: any, idx: number) => ({
          id: `item-${idx}`,
          order_id: order._id,
          dish_id: item.dishId,
          dish_name: item.dishName,
          dish_price_paise: item.dishPricePaise,
          quantity: item.quantity,
          size_name: item.sizeName || null,
          size_price_modifier_paise: item.sizePriceModifierPaise || 0,
          special_instructions: item.specialInstructions || null,
          line_total_paise: item.lineTotalPaise,
          created_at: new Date(order.createdAt).toISOString(),
          order_item_customizations: item.addons?.map((a: any, aIdx: number) => ({
            id: `custom-${idx}-${aIdx}`,
            order_item_id: `item-${idx}`,
            type: 'addon',
            name: a.name,
            price_paise: a.pricePaise,
          })) || [],
        })),
      };
    }
  } catch {
    // continue to Supabase
  }

  // 2. Supabase Fallback
  try {
    const db = sb(await createClient());
    const { data }: QR<OrderWithItems> = await db.from('orders').select('*, order_items(*, order_item_customizations(*))').eq('id', orderId).single();
    return data ?? null;
  } catch { return null; }
}

export async function getAllOrders(restaurantId: string, filters?: OrderFilters): Promise<OrderWithItems[]> {
  // 1. Try Convex
  try {
    const orders = await fetchQuery(api.orders.getOrderHistory, {});
    if (orders && orders.length > 0) {
      return orders.map((order: any) => ({
        id: order._id,
        restaurant_id: RESTAURANT_ID,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        customer_email: order.customerEmail || null,
        order_type: order.orderType,
        table_id: null,
        status: order.status,
        payment_status: order.paymentStatus,
        payment_method: order.paymentMethod,
        pickup_time: order.pickupTime || null,
        notes: order.notes || null,
        subtotal_paise: order.subtotalPaise,
        tax_paise: order.taxPaise,
        tip_paise: order.tipPaise,
        total_paise: order.totalPaise,
        idempotency_key: order.idempotencyKey || null,
        cancelled_at: null,
        cancelled_by: null,
        cancellation_reason: null,
        processed_by: null,
        created_at: new Date(order.createdAt).toISOString(),
        updated_at: new Date(order.createdAt).toISOString(),
        order_items: order.items.map((item: any, idx: number) => ({
          id: `item-${idx}`,
          order_id: order._id,
          dish_id: item.dishId,
          dish_name: item.dishName,
          dish_price_paise: item.dishPricePaise,
          quantity: item.quantity,
          size_name: item.sizeName || null,
          size_price_modifier_paise: item.sizePriceModifierPaise || 0,
          special_instructions: item.specialInstructions || null,
          line_total_paise: item.lineTotalPaise,
          created_at: new Date(order.createdAt).toISOString(),
          order_item_customizations: [],
        })),
      }));
    }
  } catch {
    // continue to Supabase
  }

  // 2. Supabase Fallback
  try {
    const db = sb(await createClient());
    let q = db.from('orders').select('*, order_items(*, order_item_customizations(*))').eq('restaurant_id', restaurantId);
    if (filters?.status) q = q.eq('status', filters.status);
    if (filters?.phone) q = q.eq('customer_phone', filters.phone);
    if (filters?.dateFrom) q = q.gte('created_at', filters.dateFrom);
    if (filters?.dateTo) q = q.lte('created_at', filters.dateTo);
    const { data }: QR<OrderWithItems[]> = await q.order('created_at', { ascending: false }).limit(100);
    return data ?? [];
  } catch { return []; }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  restaurantId: string = RESTAURANT_ID,
  actorId?: string,
  actorName?: string,
  actorRole?: string,
  sessionToken?: string
): Promise<{ error?: string }> {
  const token = sessionToken || (await getSessionToken());

  // Check if orderId is a UUID (Supabase) vs Convex Id
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

  // 1. Try Convex if not a pure UUID
  if (!isUuid) {
    try {
      const res = await fetchMutation(api.orders.updateOrderStatus, {
        orderId: orderId as any,
        status: status as any,
        sessionToken: token,
      });
      if (res && !(res as any).error) return {};
      if (res && (res as any).error) {
        console.warn('[order.service] Convex updateOrderStatus reported:', (res as any).error);
        return { error: (res as any).error };
      }
    } catch (convexError: any) {
      console.warn('[order.service] Convex updateOrderStatus failed:', convexError);
      return { error: convexError.message || 'Convex status update failed' };
    }
  }

  // 2. Supabase Fallback
  try {
    const db = sb(await createClient());
    const { data: old }: QR<{ status: string }> = await db.from('orders').select('status').eq('id', orderId).single();
    const { error }: QR<null> = await db.from('orders').update({ status }).eq('id', orderId);
    if (error) throw error;
    await db.from('audit_logs').insert({ restaurant_id: restaurantId, actor_id: actorId ?? null, actor_name: actorName ?? null, actor_role: actorRole ?? null, action: 'ORDER_STATUS_UPDATED', entity_type: 'orders', entity_id: orderId, old_value: { status: old?.status ?? null }, new_value: { status }, ip_address: null });
    return {};
  } catch (err: any) {
    return { error: err?.message || 'Failed to update order status' };
  }
}
