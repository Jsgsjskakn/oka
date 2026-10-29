const fs = require('fs');
const file = 'src/lib/services/order.service.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace getOrdersByPhone with Convex first
const oldPhone = `export async function getOrdersByPhone(phone: string): Promise<OrderWithItems[]> {
  try {
    const db = sb(await createClient());
    const { data }: QR<OrderWithItems[]> = await db.from('orders').select('*, order_items(*, order_item_customizations(*))').eq('customer_phone', phone).eq('restaurant_id', RESTAURANT_ID).order('created_at', { ascending: false }).limit(20);
    return data ?? [];
  } catch { return []; }
}`;

const newPhone = `export async function getOrdersByPhone(phone: string): Promise<OrderWithItems[]> {
  // 1. Try Convex primary
  try {
    const orders = await fetchQuery(api.orders.getOrderHistory, { phone });
    if (orders && orders.length > 0) {
      return orders.map((o: any) => mapConvexOrder(o));
    }
  } catch (convexErr) {
    console.warn('[order.service] Convex getOrdersByPhone failed, trying Supabase:', convexErr);
  }

  // 2. Supabase fallback
  try {
    const db = sb(await createClient());
    const { data }: QR<OrderWithItems[]> = await db.from('orders').select('*, order_items(*, order_item_customizations(*))').eq('customer_phone', phone).eq('restaurant_id', RESTAURANT_ID).order('created_at', { ascending: false }).limit(20);
    return data ?? [];
  } catch { return []; }
}`;

if (code.includes(oldPhone)) {
  code = code.replace(oldPhone, newPhone);
}

// In getAllOrders, replace api.orders.getActiveOrders with api.orders.getOrderHistory
code = code.replace(
  'const orders = await fetchQuery(api.orders.getActiveOrders, {});',
  'const orders = await fetchQuery(api.orders.getOrderHistory, {});'
);

fs.writeFileSync(file, code, 'utf8');
console.log('order.service.ts updated with getOrderHistory.');
